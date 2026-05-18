#include <WiFi.h>
#include <WiFiClientSecure.h> // Wajib untuk SSL HiveMQ Cloud
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ================= KONFIGURASI WIFI & MQTT =================
const char* ssid         = "Redmi Note 9 Pro";
const char* password     = "Redmi123";

// PERBAIKAN: Spasi di awal dan akhir sudah dihapus
const char* mqtt_server  = "b9057cb1f8534a298a1943e4cb1af3ba.s1.eu.hivemq.cloud";
const int mqtt_port      = 8883; // PERBAIKAN: Wajib port 8883 untuk SSL
const char* mqtt_user    = "minsel";
const char* mqtt_pass    = "SasaMinsel123";
const char* mqtt_topic   = "tes/saja"; // DISESUAIKAN: Agar nyambung ke dashboard web
// ===========================================================

WiFiClientSecure espClient; // Wajib menggunakan secure client
PubSubClient client(espClient);

unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Menghubungkan ke ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi Terhubung!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Mencoba koneksi MQTT...");
    String clientId = "ESP32Client-" + String(random(0, 0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Terhubung ke HiveMQ!");
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" coba lagi dalam 5 detik");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  
  // PERBAIKAN: Memberitahu ESP32 untuk mengabaikan verifikasi sertifikat SSL root (supaya ringkas)
  espClient.setInsecure(); 
  
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 3000) {
    lastMsg = now;

    float vr = 220.0 + random(-5, 5) * 0.5;
    float vs = 219.0 + random(-5, 5) * 0.5;
    float vt = 221.0 + random(-5, 5) * 0.5;

    float ir = 10.5 + random(-10, 10) * 0.1;
    float is = 11.2 + random(-10, 10) * 0.1;
    float it = 10.8 + random(-10, 10) * 0.1;

    float kwr = (vr * ir * 0.85) / 1000.0;
    float kws = (vs * is * 0.85) / 1000.0;
    float kwt = (vt * it * 0.85) / 1000.0;

    float thdr = 2.5 + random(0, 20) * 0.1;
    float thds = 2.8 + random(0, 20) * 0.1;
    float thdt = 2.6 + random(0, 20) * 0.1;

    StaticJsonDocument<300> doc;
    doc["vr"] = String(vr, 1);
    doc["vs"] = String(vs, 1);
    doc["vt"] = String(vt, 1);
    
    doc["ir"] = String(ir, 1);
    doc["is"] = String(is, 1);
    doc["it"] = String(it, 1);
    
    doc["kwr"] = String(kwr, 2);
    doc["kws"] = String(kws, 2);
    doc["kwt"] = String(kwt, 2);
    
    doc["thdr"] = String(thdr, 1);
    doc["thds"] = String(thds, 1);
    doc["thdt"] = String(thdt, 1);

    char jsonBuffer[300];
    serializeJson(doc, jsonBuffer);

    Serial.print("Publish payload: ");
    Serial.println(jsonBuffer);
    client.publish(mqtt_topic, jsonBuffer);
  }
}