// ==================== KONFIGURASI HIVEMQ ====================
const host = "b9057cb1f8534a298a1943e4cb1af3ba.s1.eu.hivemq.cloud"; // Contoh: xxxxx.s1.eu.hivemq.cloud (Tanpa wss:// atau port)
const port = 8884; // Port standar Secure WebSocket HiveMQ Cloud
const username = "minsel";
const password = "SasaMinsel123";
const topicSub = "tes/saja"; // Topik yang akan didengar oleh dashboard
// ============================================================

const clientId = "web_power_client_" + Math.random().toString(16).substr(2, 8);
const client = new Paho.MQTT.Client(host, port, clientId);

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

const connectOptions = {
    useSSL: true,
    userName: username,
    password: password,
    onSuccess: onConnect,
    onFailure: onFailure
};

console.log("Mencoba menghubungkan ke HiveMQ...");
client.connect(connectOptions);

function onConnect() {
    console.log("Koneksi Sukses!");
    const statusBadge = document.getElementById("mqtt-status");
    statusBadge.innerText = "CONNECTED";
    statusBadge.classList.add("connected");

    client.subscribe(topicSub);
    console.log("Subscribed ke topik: " + topicSub);
}

function onFailure(message) {
    console.log("Koneksi Gagal: " + message.errorMessage);
    document.getElementById("mqtt-status").innerText = "FAILED";
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Koneksi Terputus: " + responseObject.errorMessage);
        const statusBadge = document.getElementById("mqtt-status");
        statusBadge.innerText = "DISCONNECTED";
        statusBadge.classList.remove("connected");
    }
}

// ========== FUNGSI UTAMA PARSING DATA POWER 3-FASE ==========
function onMessageArrived(message) {
    console.log("Data Power Masuk: " + message.payloadString);
    
    try {
        const data = JSON.parse(message.payloadString);
        
        // 1. Pemetaan Tegangan (Voltage)
        if(data.vr !== undefined) document.getElementById("v-r").innerText = data.vr;
        if(data.vs !== undefined) document.getElementById("v-s").innerText = data.vs;
        if(data.vt !== undefined) document.getElementById("v-t").innerText = data.vt;
        
        // 2. Pemetaan Arus (Current)
        if(data.ir !== undefined) document.getElementById("i-r").innerText = data.ir;
        if(data.is !== undefined) document.getElementById("i-s").innerText = data.is;
        if(data.it !== undefined) document.getElementById("i-t").innerText = data.it;
        
        // 3. Pemetaan Daya Aktif (kW)
        if(data.kwr !== undefined) document.getElementById("kw-r").innerText = data.kwr;
        if(data.kws !== undefined) document.getElementById("kw-s").innerText = data.kws;
        if(data.kwt !== undefined) document.getElementById("kw-t").innerText = data.kwt;
        
        // 4. Pemetaan THD (Total Harmonic Distortion %)
        if(data.thdr !== undefined) document.getElementById("thd-r").innerText = data.thdr;
        if(data.thds !== undefined) document.getElementById("thd-s").innerText = data.thds;
        if(data.thdt !== undefined) document.getElementById("thd-t").innerText = data.thdt;

    } catch (e) {
        console.log("Gagal parsing data power. Pastikan format kiriman adalah JSON string.");
    }
}