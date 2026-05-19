// ==================== KONFIGURASI HIVEMQ ====================
const host = "b9057cb1f8534a298a1943e4cb1af3ba.s1.eu.hivemq.cloud"; 
const port = 8884; 
const username = "minsel";
const password = "SasaMinsel123";
const topicSub = "tes/saja"; 
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
const maxDataPoints = 15; 
const chartOptions = {
    responsive: true,
    scales: {
        x: { grid: { color: '#3e4451' }, ticks: { color: '#abb2bf' } },
        y: { grid: { color: '#3e4451' }, ticks: { color: '#abb2bf' } }
    },
    plugins: { legend: { labels: { color: '#abb2bf' } } }
};

const ctxV = document.getElementById('voltageChart').getContext('2d');
const voltageChart = new Chart(ctxV, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
            { label: 'Phase R', data: [], borderColor: '#e06c75', tension: 0.2, pointRadius: 2 },
            { label: 'Phase S', data: [], borderColor: '#d19a66', tension: 0.2, pointRadius: 2 },
            { label: 'Phase T', data: [], borderColor: '#61afef', tension: 0.2, pointRadius: 2 }
        ]
    },
    options: chartOptions
});

const ctxI = document.getElementById('currentChart').getContext('2d');
const currentChart = new Chart(ctxI, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
            { label: 'Phase R', data: [], borderColor: '#e06c75', tension: 0.2, pointRadius: 2 },
            { label: 'Phase S', data: [], borderColor: '#d19a66', tension: 0.2, pointRadius: 2 },
            { label: 'Phase T', data: [], borderColor: '#61afef', tension: 0.2, pointRadius: 2 }
        ]
    },
    options: chartOptions
});

function updateChartData(chart, labelTime, valR, valS, valT) {
    chart.data.labels.push(labelTime);
    chart.data.datasets[0].data.push(valR);
    chart.data.datasets[1].data.push(valS);
    chart.data.datasets[2].data.push(valT);

    if (chart.data.labels.length > maxDataPoints) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
        chart.data.datasets[2].data.shift();
    }
    chart.update();
}

// ========== PARSING & DATA PROCESSING ==========
function onMessageArrived(message) {
    try {
        const data = JSON.parse(message.payloadString);
        const now = new Date();
        const timeLabel = now.getHours().toString().padStart(2, '0') + ":" + 
                          now.getMinutes().toString().padStart(2, '0') + ":" + 
                          now.getSeconds().toString().padStart(2, '0');
        
        // 1. Ambil Nilai Mentah / Gunakan Default Simulasi jika Kosong
        let vr = data.vr !== undefined ? parseFloat(data.vr) : 0;
        let vs = data.vs !== undefined ? parseFloat(data.vs) : 0;
        let vt = data.vt !== undefined ? parseFloat(data.vt) : 0;
        
        let ir = data.ir !== undefined ? parseFloat(data.ir) : 0;
        let is = data.is !== undefined ? parseFloat(data.is) : 0;
        let it = data.it !== undefined ? parseFloat(data.it) : 0;

        let kwr = data.kwr !== undefined ? parseFloat(data.kwr) : 0;
        let kws = data.kws !== undefined ? parseFloat(data.kws) : 0;
        let kwt = data.kwt !== undefined ? parseFloat(data.kwt) : 0;

        // Wadah Tambahan untuk Parameter Baru (Cosphi & THD)
        let pfr = data.pfr !== undefined ? data.pfr : "0.98";
        let pfs = data.pfs !== undefined ? data.pfs : "0.97";
        let pft = data.pft !== undefined ? data.pft : "0.99";

        let thdr = data.thdr !== undefined ? data.thdr : "1.2";
        let thds = data.thds !== undefined ? data.thds : "1.4";
        let thdt = data.thdt !== undefined ? data.thdt : "1.1"; 

        // 2. Tampilkan Data Utama ke Tabel HTML
        document.getElementById("v-r").innerText = vr || "--";
        document.getElementById("v-s").innerText = vs || "--";
        document.getElementById("v-t").innerText = vt || "--";
        
        document.getElementById("i-r").innerText = ir || "--";
        document.getElementById("i-s").innerText = is || "--";
        document.getElementById("i-t").innerText = it || "--";
        
        document.getElementById("kw-r").innerText = kwr || "--";
        document.getElementById("kw-s").innerText = kws || "--";
        document.getElementById("kw-t").innerText = kwt || "--";

        document.getElementById("pf-r").innerText = pfr;
        document.getElementById("pf-s").innerText = pfs;
        document.getElementById("pf-t").innerText = pft;
        
        document.getElementById("thd-r").innerText = thdr;
        document.getElementById("thd-s").innerText = thds;
        document.getElementById("thd-t").innerText = thdt;

        // 3. MATEMATIKA OTOMATIS: Update Wadah KPI Summary Cards atas
        if(vr > 0 || vs > 0 || vt > 0) {
            // Hitung Rata-rata Tegangan
            let avgV = (vr + vs + vt) / 3;
            document.getElementById("kpi-avg-v").innerHTML = avgV.toFixed(1) + "<span>V</span>";
            
            // Hitung Total kW
            let totalKw = kwr + kws + kwt;
            document.getElementById("kpi-total-kw").innerHTML = totalKw.toFixed(2) + "<span>kW</span>";
            
            // Tampilkan Frekuensi Statis Pabrik (bisa dimapping nanti)
            document.getElementById("kpi-freq").innerHTML = "50.02<span>Hz</span>";

            // Deteksi Keseimbangan Arus Sederhana (Maksimal selisih beban fasa)
            let maxI = Math.max(ir, is, it);
            let minI = Math.min(ir, is, it);
            let statusCard = document.getElementById("kpi-status");
            if ((maxI - minI) > 15 && minI > 0) { // Jika selisih antar fasa > 15 Ampere
                statusCard.innerText = "UNBALANCED";
                statusCard.style.color = "#e06c75";
            } else {
                statusCard.innerText = "BALANCED";
                statusCard.style.color = "#98c379";
            }

            // Push ke Grafik
            updateChartData(voltageChart, timeLabel, vr, vs, vt);
            updateChartData(currentChart, timeLabel, ir, is, it);
        }

    } catch (e) {
        console.log("Error processing dashboard layout: " + e);
    }
}

// Simulasi wadah fitur ekspor data log ke depan
function exportData() {
    alert("Fitur Export Log Data Panel Sukses Disiapkan! (Siap dihubungkan ke Database/Local Storage nanti)");
}