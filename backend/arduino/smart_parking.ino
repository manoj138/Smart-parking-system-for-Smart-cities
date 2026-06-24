/**
 * Smart Parking System - NodeMCU ESP8266 Advanced IoT Gateway
 * 
 * This sketch measures distance using an HC-SR04 Ultrasonic Sensor,
 * scans subscription cards using an RC522 RFID Module, 
 * displays status on an I2C SSD1306 OLED Screen,
 * lights up a WS2812B RGB Neopixel indicator based on slot occupancy,
 * opens a SG90 Servo barrier, and sounds a Buzzer on parking violations.
 * All logs are updated and HTTP POST payloads are sent to the central Flask API.
 * 
 * Required Arduino Libraries (Install via Library Manager):
 * 1. MFRC522 (by GithubCommunity)
 * 2. Adafruit SSD1306 (by Adafruit)
 * 3. Adafruit GFX Library (by Adafruit)
 * 4. Adafruit NeoPixel (by Adafruit)
 * 5. Servo (standard library)
 * 
 * Hardware Pin Wiring Connections:
 * ------------------------------------------------------------------
 * 1. SSD1306 OLED Screen (I2C):
 *    - VCC -> NodeMCU 3.3V
 *    - GND -> NodeMCU GND
 *    - SCL -> NodeMCU D1 (GPIO 5)
 *    - SDA -> NodeMCU D2 (GPIO 4)
 * 
 * 2. RC522 RFID Reader (SPI):
 *    - VCC -> NodeMCU 3.3V (Do NOT connect to 5V!)
 *    - RST -> NodeMCU D3 (GPIO 0)
 *    - GND -> NodeMCU GND
 *    - MISO -> NodeMCU D6 (GPIO 12)
 *    - MOSI -> NodeMCU D7 (GPIO 13)
 *    - SCK -> NodeMCU D5 (GPIO 14)
 *    - SDA (SS) -> NodeMCU D8 (GPIO 15)
 * 
 * 3. SG90 Servo Motor:
 *    - VCC -> NodeMCU 5V (VIN)
 *    - GND -> NodeMCU GND
 *    - Signal -> NodeMCU D0 (GPIO 16)
 * 
 * 4. WS2812B RGB Neopixel:
 *    - VCC -> NodeMCU 3.3V
 *    - GND -> NodeMCU GND
 *    - DIN -> NodeMCU D4 (GPIO 2)
 * 
 * 5. Active Buzzer:
 *    - Positive (+) -> NodeMCU D9 / RX (GPIO 3)
 *    - Negative (-) -> NodeMCU GND
 * 
 * 6. HC-SR04 Ultrasonic Sensor:
 *    - VCC -> NodeMCU 5V (VIN)
 *    - GND -> NodeMCU GND
 *    - Trig -> NodeMCU D10 / TX (GPIO 1)
 *    - Echo -> NodeMCU D11 / SD3 (GPIO 10) or any spare GPIO
 * ------------------------------------------------------------------
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#include <Servo.h>

// --- Configuration Wi-Fi & API ---
const char* ssid = "YOUR_WIFI_SSID";          // Replace with your Wi-Fi SSID
const char* password = "YOUR_WIFI_PASSWORD";  // Replace with your Wi-Fi Password
const char* serverUrl = "http://192.168.1.100:5000/api/iot/slot-update"; 
const char* entryUrl = "http://192.168.1.100:5000/api/entry";
const char* slotNumber = "P1";

// --- Hardware Pins ---
#define SERVO_PIN      16  // D0 (GPIO 16)
#define OLED_RESET     -1  // Share NodeMCU Reset
#define NEOPIXEL_PIN    2  // D4 (GPIO 2)
#define BUZZER_PIN      3  // RX (GPIO 3)
#define TRIG_PIN        1  // TX (GPIO 1)
#define ECHO_PIN       10  // SD3 (GPIO 10)

#define SS_PIN         15  // D8 (GPIO 15)
#define RST_PIN         0  // D3 (GPIO 0)

// --- Initializing Components ---
Adafruit_SSD1306 display(128, 64, &Wire, OLED_RESET);
MFRC522 mfrc522(SS_PIN, RST_PIN);
Adafruit_NeoPixel strip(1, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
Servo gateServo;

// --- State Variables ---
float distanceCm = 0;
long duration = 0;
bool isOccupied = false;
String lastUid = "";

void setup() {
  Serial.begin(115200);
  SPI.begin();
  
  // Pin Setup
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Initialize Neopixel
  strip.begin();
  strip.setPixelColor(0, strip.Color(0, 0, 255)); // Blue on startup
  strip.show();

  // Initialize Servo
  gateServo.attach(SERVO_PIN);
  gateServo.write(0); // Calibrated Close

  // Initialize RFID
  mfrc522.PCD_Init();

  // Initialize OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("OLED SSD1306 allocation failed!"));
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(0, 0);
    display.println("SMART PARKING SYSTEM");
    display.println("Connecting WiFi...");
    display.display();
  }

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi Connected!");
  Serial.println(WiFi.localIP());

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("SMART PARKING");
  display.println("SYSTEM OK");
  display.print("IP: ");
  display.println(WiFi.localIP());
  display.display();

  strip.setPixelColor(0, strip.Color(0, 255, 0)); // Green on success/online
  strip.show();
}

void loop() {
  // 1. READ ULTRASONIC SENSOR (HC-SR04)
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  duration = pulseIn(ECHO_PIN, HIGH);
  distanceCm = duration * 0.034 / 2.0;

  if (distanceCm <= 0 || distanceCm > 400) {
    distanceCm = 999.0; // Out of range/Clear
  }

  isOccupied = (distanceCm <= 15.0);

  // 2. command Neopixel LED Indicators
  if (distanceCm <= 5.0) {
    // Too close / crash alarm
    strip.setPixelColor(0, strip.Color(255, 0, 0)); // Solid Red
    strip.show();
    digitalWrite(BUZZER_PIN, HIGH); // Alarm buzzer
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
  } else if (isOccupied) {
    strip.setPixelColor(0, strip.Color(255, 0, 0)); // Solid Red for Occupied
    strip.show();
  } else {
    strip.setPixelColor(0, strip.Color(0, 255, 0)); // Solid Green for vacant
    strip.show();
  }

  // 3. UPDATE OLED SCREEN DISPLAY
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("SMART PARKING TERMINAL");
  display.println("---------------------");
  display.print("Slot Number: ");
  display.println(slotNumber);
  display.print("Distance: ");
  display.print(distanceCm, 1);
  display.println(" cm");
  display.print("Status: ");
  display.println(isOccupied ? "OCCUPIED" : "VACANT");
  display.display();

  // 4. TELEMETRY HTTP TRANSMISSION (FLASK GATEWAY)
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String jsonPayload = "{\"slot_number\":\"" + String(slotNumber) + "\",\"distance_cm\":" + String(distanceCm, 2) + "}";
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Telemetry HTTP Success. Status code: " + String(httpResponseCode));
    }
    http.end();
  }

  // 5. SCAN RFID CARD (RC522)
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String cardUid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      cardUid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      cardUid += String(mfrc522.uid.uidByte[i], HEX);
      if (i < mfrc522.uid.size - 1) cardUid += " ";
    }
    cardUid.toUpperCase();
    Serial.println("RFID card scanned: UID: " + cardUid);
    
    // Play auth chime
    digitalWrite(BUZZER_PIN, HIGH);
    delay(80);
    digitalWrite(BUZZER_PIN, LOW);
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("RFID PASS DETECTED");
    display.print("UID: ");
    display.println(cardUid);
    display.println("Authenticating...");
    display.display();

    // Send check-in authentication to entry API
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;
      http.begin(client, entryUrl);
      http.addHeader("Content-Type", "application/json");

      String payload = "{\"vehicle_number\":\"MH12RFID_" + cardUid.substring(0, 5) + "\",\"vehicle_type\":\"Car\",\"owner_name\":\"RFID Subscriber\",\"phone\":\"9876543210\"}";
      int responseCode = http.POST(payload);

      if (responseCode == 200 || responseCode == 201) {
        // Access granted, open Servo Barrier
        display.clearDisplay();
        display.setCursor(0, 0);
        display.println("ACCESS GRANTED");
        display.println("Barrier Lifted!");
        display.display();
        
        gateServo.write(90); // Open gate
        delay(5000);         // Wait 5 seconds
        gateServo.write(0);  // Close gate
      } else {
        display.clearDisplay();
        display.setCursor(0, 0);
        display.println("ACCESS DENIED");
        display.println("Auth Failure");
        display.display();
        
        // Error alarm
        digitalWrite(BUZZER_PIN, HIGH);
        delay(400);
        digitalWrite(BUZZER_PIN, LOW);
      }
      http.end();
    }
    mfrc522.PICC_HaltA();
  }

  delay(2000); // 2 second telemetry loop interval
}
