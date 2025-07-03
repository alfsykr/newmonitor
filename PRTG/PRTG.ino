#include <ModbusMaster.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#include <ESPmDNS.h>

// ===== OLED Setup =====
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ===== WiFi Setup =====
const char* ssid = "Redmi 10C";
const char* password = "123456789";

// ===== PRTG Setup - Gunakan hostname atau dynamic discovery =====
const char* prtgHostname = "DESKTOP-AO8QQ35.local"; // Hostname laptop Anda
String prtgHost = ""; // Akan diisi secara otomatis
const char* prtgPort = "5051";
const char* token = "151946EC-E3D2-4D9F-8762-C4F86CE3FA90";

// ===== Smart IP Range - IP yang sering digunakan =====
int commonIPs[] = {60, 50, 100, 1, 2, 10, 20, 30, 40, 70, 80, 90, 110, 120}; // Prioritas IP
int numCommonIPs = sizeof(commonIPs) / sizeof(commonIPs[0]);

// ===== Firebase Setup =====
const char* firebaseHost = "https://monitoring-suhu-c2b68-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* firebasePath = "/sensor.json";

// ===== Modbus Setup =====
ModbusMaster node;

// ===== Network Discovery Variables =====
IPAddress gatewayIP;
String networkBase;

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600, SERIAL_8N1, 17, 16);

  // OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED tidak ditemukan"));
    while (1);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Inisialisasi...");
  display.display();

  // Modbus slave ID
  node.begin(1, Serial1);

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  display.setCursor(0, 20);
  display.print("WiFi...");
  display.display();

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Terhubung!");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
  
  display.setCursor(0, 30);
  display.print("WiFi Terhubung!");
  display.display();
  delay(1000);

  // Dapatkan informasi network
  gatewayIP = WiFi.gatewayIP();
  IPAddress localIP = WiFi.localIP();
  networkBase = String(localIP[0]) + "." + String(localIP[1]) + "." + String(localIP[2]) + ".";
  
  Serial.println("Gateway IP: " + gatewayIP.toString());
  Serial.println("Network Base: " + networkBase);

  Serial.println("=== MENGGUNAKAN NILAI RAW ===");
  Serial.println("Suhu menggunakan nilai mentah dari sensor");
  Serial.println("=============================");

  // Inisialisasi mDNS untuk hostname discovery
  if (!MDNS.begin("esp32-sensor")) {
    Serial.println("Error setting up MDNS responder!");
  }

  // Cari PRTG server
  findPRTGServer();

  // Inisialisasi waktu NTP
  configTime(7 * 3600, 0, "pool.ntp.org");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    Serial.println("Menunggu sinkronisasi waktu...");
    delay(500);
  }
}

void findPRTGServer() {
  Serial.println("Mencari PRTG server...");
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Mencari PRTG...");
  display.display();

  // Method 1: Coba resolve hostname menggunakan mDNS
  if (strlen(prtgHostname) > 0) {
    Serial.println("Mencoba mDNS untuk: " + String(prtgHostname));
    IPAddress serverIP = MDNS.queryHost(prtgHostname);
    if (serverIP != INADDR_NONE) {
      prtgHost = "https://" + serverIP.toString() + ":" + prtgPort;
      Serial.println("PRTG ditemukan via mDNS: " + prtgHost);
      display.setCursor(0, 20);
      display.println("mDNS: " + serverIP.toString());
      display.display();
      return;
    }
    Serial.println("mDNS gagal, lanjut ke scan cepat...");
  }

  // Method 2: Coba gateway IP dulu (router biasanya .1)
  String gatewayTest = "https://" + gatewayIP.toString() + ":" + prtgPort;
  Serial.println("Testing gateway: " + gatewayIP.toString());
  if (testPRTGConnection(gatewayTest)) {
    prtgHost = gatewayTest;
    Serial.println("PRTG ditemukan di gateway: " + prtgHost);
    return;
  }

  // Method 3: Smart scan - cek IP yang umum digunakan dulu
  Serial.println("Smart scan untuk IP umum...");
  for (int i = 0; i < numCommonIPs; i++) {
    String testIP = networkBase + String(commonIPs[i]);
    String testURL = "https://" + testIP + ":" + prtgPort;
    
    Serial.print("Testing priority IP: " + testIP + " ... ");
    display.setCursor(0, 30);
    display.printf("Test: %s", testIP.c_str());
    display.display();
    
    if (testPRTGConnection(testURL)) {
      prtgHost = testURL;
      Serial.println("PRTG server ditemukan: " + prtgHost);
      display.setCursor(0, 40);
      display.println("Found: " + testIP);
      display.display();
      return;
    }
    Serial.println("No");
  }

  // Method 4: Parallel scan dalam range terbatas (hanya jika perlu)
  Serial.println("Scan range terbatas...");
  
  // Scan range yang lebih masuk akal: 50-70, 1-20, 100-120
  int ranges[][2] = {{50, 70}, {1, 20}, {100, 120}, {121, 150}};
  int numRanges = sizeof(ranges) / sizeof(ranges[0]);
  
  for (int r = 0; r < numRanges; r++) {
    Serial.printf("Scanning range %d-%d...\n", ranges[r][0], ranges[r][1]);
    
    for (int i = ranges[r][0]; i <= ranges[r][1]; i++) {
      String testIP = networkBase + String(i);
      String testURL = "https://" + testIP + ":" + prtgPort;
      
      Serial.print("Testing: " + testIP + " ... ");
      
      if (testPRTGConnection(testURL)) {
        prtgHost = testURL;
        Serial.println("PRTG server ditemukan: " + prtgHost);
        display.setCursor(0, 40);
        display.println("Found: " + testIP);
        display.display();
        return;
      }
      
      Serial.println("No");
      
      // Update progress
      if (i % 5 == 0) {
        display.setCursor(0, 50);
        display.printf("Range %d: %d", r+1, i);
        display.display();
      }
      
      delay(50); // Lebih cepat
    }
  }
  
  Serial.println("PRTG server tidak ditemukan dalam range umum!");
  display.setCursor(0, 50);
  display.println("PRTG not found!");
  display.display();
}

bool testPRTGConnection(String url) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(1000); // Lebih cepat - 1 detik
  
  HTTPClient https;
  if (https.begin(client, url + "/" + token)) {
    https.setTimeout(1000); // 1 detik timeout
    int httpCode = https.GET();
    https.end();
    
    // PRTG biasanya return 200 atau 400-series untuk endpoint yang valid
    if (httpCode > 0 && httpCode != -1 && httpCode != -11) { // -11 adalah timeout
      return true;
    }
  }
  return false;
}

void loop() {
  Serial.println("Requesting data...");
  uint8_t result = node.readInputRegisters(0x0001, 2);

  display.clearDisplay();

  if (result == node.ku8MBSuccess) {
    // Baca data mentah dari sensor - gunakan nilai raw saja
    float temp = node.getResponseBuffer(0) / 10.0;
    float hum = node.getResponseBuffer(1) / 10.0;

    // OLED - tampilkan suhu raw (lebih akurat)
    display.setCursor(0, 0);
    display.println("Suhu & Kelembaban:");
    display.setCursor(0, 20);
    display.printf("Suhu: %.1f C", temp);
    display.setCursor(0, 40);
    display.printf("Lembab: %.1f %%", hum);
    display.display();

    // Serial - tampilkan nilai raw
    Serial.printf("Temperature: %.1f °C | Humidity: %.1f %%RH\n", temp, hum);

    // Kirim data raw ke PRTG
    if (prtgHost != "") {
      sendToPRTG(temp, hum);
    } else {
      Serial.println("PRTG server belum ditemukan, mencoba lagi...");
      findPRTGServer();
    }

    // Kirim data raw ke Firebase
    sendToFirebase(temp, hum);

  } else {
    Serial.print("Modbus Error. Code: 0x");
    Serial.println(result, HEX);

    display.setCursor(0, 0);
    display.println("Error Modbus:");
    display.setCursor(0, 20);
    display.printf("Code: 0x%02X", result);
    display.display();
  }

  delay(60000); // Kirim data setiap 60 detik
}

void sendToPRTG(float temp, float hum) {
  if (WiFi.status() == WL_CONNECTED && prtgHost != "") {
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient https;
    String url = prtgHost + "/" + token;

    Serial.print("Mengirim ke PRTG: ");
    Serial.println(url);

    if (https.begin(client, url)) {
      https.addHeader("Content-Type", "application/json");
      
      // Gunakan suhu raw untuk PRTG
      int tempValue = (int)temp;
      int humValue = (int)hum;
      
      String jsonPayload = "{\"prtg\":{\"result\":[";
      jsonPayload += "{\"channel\":\"Temperature\",\"value\":" + String(tempValue) + "},";
      jsonPayload += "{\"channel\":\"Humidity\",\"value\":" + String(humValue) + "}";
      jsonPayload += "]}}";

      Serial.println("JSON Payload (Raw Values):");
      Serial.println(jsonPayload);

      int httpCode = https.POST(jsonPayload);
      
      if (httpCode > 0) {
        Serial.printf("PRTG Response code: %d\n", httpCode);
        String response = https.getString();
        Serial.println("Response: " + response);
      } else {
        Serial.printf("Gagal kirim ke PRTG: %s\n", https.errorToString(httpCode).c_str());
        // Jika gagal, coba cari server lagi
        Serial.println("Mencoba mencari PRTG server lagi...");
        prtgHost = ""; // Reset untuk trigger pencarian ulang
      }
      https.end();
    } else {
      Serial.println("Koneksi HTTPS gagal ke PRTG");
    }
  } else {
    Serial.println("WiFi tidak terhubung atau PRTG server tidak ditemukan.");
  }
}

void sendToFirebase(float temp, float hum) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient https;
    String url = String(firebaseHost) + String(firebasePath);

    struct tm timeinfo;
    char timeString[6] = "00:00";
    if (getLocalTime(&timeinfo)) {
      strftime(timeString, sizeof(timeString), "%H:%M", &timeinfo);
    }

    // Gunakan suhu raw untuk Firebase
    String jsonPayload = "{\"time\":\"" + String(timeString) + "\",\"temperature\":" + String(temp, 1) + ",\"humidity\":" + String(hum, 1) + "}";

    if (https.begin(client, url)) {
      https.addHeader("Content-Type", "application/json");
      int httpCode = https.POST(jsonPayload);
      if (httpCode > 0) {
        Serial.printf("Firebase Response code: %d\n", httpCode);
        String response = https.getString();
        Serial.println("Firebase Response: " + response);
      } else {
        Serial.printf("Gagal kirim ke Firebase: %s\n", https.errorToString(httpCode).c_str());
      }
      https.end();
    } else {
      Serial.println("Koneksi HTTPS gagal ke Firebase");
    }
  } else {
    Serial.println("WiFi tidak terhubung saat kirim ke Firebase.");
  }
}