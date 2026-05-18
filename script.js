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
}

function onFailure(message) {
    console.log("Koneksi Gagal: " + message.errorMessage);
    document.getElementById("mqtt-status").innerText = "FAILED";
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        document.getElementById("mqtt-status").innerText = "DISCONNECTED";
        document.getElementById("mqtt-status").classList.remove("connected");
    }
}

// ==================== INISIALISASI GRAFIK (CHART.JS) ====================
const maxDataPoints = 15; // Jumlah histori poin data yang tampil di grafik

// Opsi konfigurasi umum untuk grafik agar serasi dengan tema dark mode
const chartOptions = {
    responsive: true,
    scales: {
        x: { grid: { color: '#3e4451' }, ticks: { color: '#abb2bf' } },
        y: { grid: { color: '#3e4451' }, ticks: { color: '#abb2bf' } }
    },
    plugins: { legend: { labels: { color: '#abb2bf' } } }
};

// 1. Grafik Tegangan
const ctxV = document.getElementById('voltageChart').getContext('2d');
const voltageChart = new Chart(ctxV, {
    type: 'line',
    data: {
        labels: [], // Label waktu (X)
        datasets: [
            { label: 'Fasa R', data: [], borderColor: '#e06c75', tension: 0.3, pointRadius: 2 },
            { label: 'Fasa S', data: [], borderColor: '#d19a66', tension: 0.3, pointRadius: 2 },
            { label: 'Fasa T', data: [], borderColor: '#61afef', tension: 0.3, pointRadius: 2 }
        ]
    },
    options: chartOptions
});

// 2. Grafik Arus
const ctxI = document.getElementById('currentChart').getContext('2d');
const currentChart = new Chart(ctxI, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Fasa R', data: [], borderColor: '#e06c75', tension: 0.3, pointRadius: 2 },
            { label: 'Fasa S', data: [], borderColor: '#d19a66', tension: 0.3, pointRadius: 2 },
            { label: 'Fasa T', data: [], borderColor: '#61afef', tension: 0.3, pointRadius: 2 }
        ]
    },
    options: chartOptions
});

// Fungsi pembantu untuk update grafik secara real-time
void function updateChartData(chart, labelTime, valR, valS, valT) {
    // Tambah data baru ke array paling belakang
    chart.data.labels.push(labelTime);
    chart.data.datasets[0].data.push(valR);
    chart.data.datasets[1].data.push(valS);
    chart.data.datasets[2].data.push(valT);

    // Jika data melebihi batas maksimum, hapus data paling awal (shift)
    if (chart.data.labels.length > maxDataPoints) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
        chart.data.datasets[2].data.shift();
    }
    chart.update(); // Render ulang grafik
}

// ========== FUNGSI PARSING DATA & MASUKKAN KE CHART ==========
function onMessageArrived(message) {
    try {
        const data = JSON.parse(message.payloadString);
        
        // Ambil waktu lokal saat data masuk sebagai label sumbu X
        const now = new Date();
        const timeLabel = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        
        // 1. Tampilkan ke Tabel HTML
        if(data.vr !== undefined) document.getElementById("v-r").innerText = data.vr;
        if(data.vs !== undefined) document.getElementById("v-s").innerText = data.vs;
        if(data.vt !== undefined) document.getElementById("v-t").innerText = data.vt;
        
        if(data.ir !== undefined) document.getElementById("i-r").innerText = data.ir;
        if(data.is !== undefined) document.getElementById("i-s").innerText = data.is;
        if(data.it !== undefined) document.getElementById("i-t").innerText = data.it;
        
        if(data.kwr !== undefined) document.getElementById("kw-r").innerText = data.kwr;
        if(data.kws !== undefined) document.getElementById("kw-s").innerText = data.kws;
        if(data.kwt !== undefined) document.getElementById("kw-t").innerText = data.kwt;
        
        if(data.thdr !== undefined) document.getElementById("thd-r").innerText = data.thdr;
        if(data.thds !== undefined) document.getElementById("thd-s").innerText = data.thds;
        if(data.thdt !== undefined) document.getElementById("thd-t").innerText = data.thdt;

        // 2. Masukkan Data ke Grafik secara Real-Time
        if(data.vr !== undefined && data.vs !== undefined && data.vt !== undefined) {
            updateChartData(voltageChart, timeLabel, data.vr, data.vs, data.vt);
        }
        if(data.ir !== undefined && data.is !== undefined && data.it !== undefined) {
            updateChartData(currentChart, timeLabel, data.ir, data.is, data.it);
        }

    } catch (e) {
        console.log("Gagal parsing JSON atau mengupdate grafik.");
    }
}