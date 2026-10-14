/* ==========================================================================
   PROJECT: METEO & EMERGENCY ALERT SYSTEM (CORE APP CONTROLLER)
   ========================================================================== */

// 1. ฐานข้อมูลพิกัดและสภาพอากาศ (อ้างอิงสถานการณ์อุทกภัยและพื้นที่เสี่ยง)
const weatherDatabase = {
    TH: {
        name: "ประเทศไทย", center: [13.7563, 100.5018],
        provinces: {
            bangkok: { name: "กรุงเทพมหานคร", temp: "31°C", sky: "🌤️ มีเมฆบางส่วน", humid: "68%", wind: "ลมใต้ 12 กม./ชม.", rain: "10%", status: "ปกติ", level: "safe" },
            chiangmai: { name: "เชียงใหม่ (พื้นที่ลุ่มน้ำ)", temp: "24°C", sky: "🌧️ ฝนตกหนักสะสม", humid: "95%", wind: "ลมเหนือ 8 กม./ชม.", rain: "85%", status: "เฝ้าระวังน้ำป่าไหลหลาก", level: "warning" },
            phuket: { name: "ภูเก็ต (พื้นที่ชายฝั่ง)", temp: "29°C", sky: "⛈️ พายุฝนฟ้าคะนอง", humid: "98%", wind: "มรสุมตะวันตกฯ 30 กม./ชม.", rain: "95%", status: "วิกฤต! น้ำล้นตลิ่งท่วมขัง", level: "danger" }
        }
    },
    JP: {
        name: "ประเทศญี่ปุ่น", center: [35.6762, 139.6503],
        provinces: {
            tokyo: { name: "โตเกียว", temp: "16°C", sky: "☀️ ฟ้าโปร่งแจ่มใส", humid: "45%", wind: "ลมตะวันออก 8 กม./ชม.", rain: "0%", status: "ปกติ", level: "safe" }
        }
    }
};

let globeInstance;

// 2. ระบบริเริ่มสร้างลูกโลก 3 มิติสไตล์ Minimal Luxury
function initGlobeSystem() {
    const container = document.getElementById('globe-container');
    if (!container) return;

    // ขึ้นโครงรูปทรงกลมผิวโลกสีขาวนวลตา เพื่อให้สามารถเปิดใช้งานข้ามระบบโฮสติ้งได้อย่างราบรื่น
    globeInstance = Globe()
        (container)
        .showGlobe(true)
        .globeColor('rgba(235, 240, 250, 0.95)') 
        .backgroundColor('#f8f9fa')             
        .showAtmosphere(true)                  
        .atmosphereColor('#cbd5e1')            
        .atmosphereDaylightAlpha(0.25);

    // รองรับ Responsive UI ทั้งบน Chromebook และสมาร์ตโฟน
    function resizeCanvas() {
        globeInstance.width(container.offsetWidth);
        globeInstance.height(window.innerHeight);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ดักจับการเปลี่ยนคำสั่งใน Select Box
    document.getElementById('country-select').addEventListener('change', handleCountryUpdate);
    document.getElementById('province-select').addEventListener('change', handleProvinceUpdate);

    handleCountryUpdate();
}

// 3. ฟังก์ชันควบคุมเมื่อเลือกประเทศ (หมุดจะปักตามระดับความรุนแรงของภัยพิบัติ)
function handleCountryUpdate() {
    const countryKey = document.getElementById('country-select').value;
    const provinceSelect = document.getElementById('province-select');
    const countryData = weatherDatabase[countryKey];
    
    if (!countryData) return;
    provinceSelect.innerHTML = '<option value="">เลือกจังหวัด / เมืองย่อย</option>';
    
    // หมุดลูกโลก 3 มิติเข้าหาเป้าหมายแบบ Smooth Camera
    globeInstance.pointOfView({ lat: countryData.center[0], lng: countryData.center[1], alt: 1.4 }, 2000);

    // สร้างเมนูพื้นที่ย่อย
    Object.keys(countryData.provinces).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.innerText = countryData.provinces[key].name;
        provinceSelect.appendChild(opt);
    });

    // คุมโทนสีหมุด: ปลอดภัย (สีเทาพรีเมียม), เฝ้าระวัง (สีส้ม), วิกฤตน้ำท่วม (สีแดงนีออนกระพริบ)
    const markerData = Object.keys(countryData.provinces).map((key, index) => {
        const prov = countryData.provinces[key];
        let markerColor = '#4a5568'; // safe
        if (prov.level === 'warning') markerColor = '#dd6b20';
        if (prov.level === 'danger') markerColor = '#e53e3e';

        return {
            lat: countryData.center[0] + (index - 1) * 1.5, // กระจายพิกัดจุดตรวจวัด
            lng: countryData.center[1] + (index - 1) * 1.5,
            color: markerColor,
            name: prov.name,
            level: prov.level
        }
    });
    
    // วาดหมุด 3 มิติลงบนผิวโลก
    globeInstance.pointsData(markerData)
                 .pointAltitude(0.05)
                 .pointColor('color')
                 .pointRadius(0.2)
                 .labelsData(markerData)
                 .labelLat(d => d.lat)
                 .labelLng(d => d.lng)
                 .labelText(d => d.name)
                 .labelSize(0.6)
                 .labelColor(() => '#718096')
                 .labelResolution(2);
}

// 4. ฟังก์ชันอัปเดตรายละเอียดข้อความสภาพอากาศฝั่งกระจกฝ้า
function handleProvinceUpdate() {
    const countryKey = document.getElementById('country-select').value;
    const provinceKey = document.getElementById('province-select').value;
    const panel = document.getElementById('weather-panel');
    
    if (!provinceKey) {
        panel.innerHTML = '<p class="placeholder-text">กรุณาเลือกพื้นที่บนลูกโลก...</p>';
        return;
    }
    
    const data = weatherDatabase[countryKey].provinces[provinceKey];
    let statusColor = 'var(--text-dark)';
    if (data.level === 'warning') statusColor = '#dd6b20';
    if (data.level === 'danger') statusColor = '#e53e3e';

    panel.innerHTML = `
        <div style="font-size: 15px; font-weight: 600; margin-top: 10px;">📍 ${data.name}</div>
        <div style="display: flex; align-items: baseline; gap: 10px; margin: 6px 0;">
            <div style="font-size: 34px; font-weight: 300; letter-spacing: -1px;">${data.temp}</div>
            <div style="font-size: 14px; color: var(--text-muted);">${data.sky}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="background: rgba(255,255,255,0.6); border: 1px solid var(--border-line); padding: 8px; border-radius: 12px;">
                <div style="font-size: 10px; color: var(--text-muted);">🌧️ ปริมาณฝน/ลม</div>
                <div style="font-size: 12px; font-weight: 500;">${data.rain}</div>
            </div>
            <div style="background: rgba(255,255,255,0.6); border: 1px solid var(--border-line); padding: 8px; border-radius: 12px;">
                <div style="font-size: 10px; color: var(--text-muted);">⚠️ สถานการณ์</div>
                <div style="font-size: 11px; font-weight: 600; color: ${statusColor};">${data.status}</div>
            </div>
        </div>
    `;
}

// 5. ระบบรับสัญญาณ Broadcaster และยิงการแจ้งเตือนภัยอุทกภัยฉุกเฉินเข้าสู่ระบบปฏิบัติการ
function initAlertBroadcast() {
    const subscribeBtn = document.getElementById('btn-broadcast-subscribe');
    const emergencyCenter = document.getElementById('emergency-center');

    if (!subscribeBtn) return;

    subscribeBtn.addEventListener('click', () => {
        subscribeBtn.innerText = "✅ เชื่อมต่อศูนย์สัญญาณเตือนภัยแล้ว";
        subscribeBtn.style.background = "#2f855a";
        
        // จำลองเหตุการณ์เร่งด่วน: ข้อมูลอุทกภัยฉุกเฉินถูกยิงมาจากหน่วยงานภาครัฐในอีก 1.5 วินาที
        setTimeout(() => {
            if (emergencyCenter) {
                emergencyCenter.innerHTML = `
                    <div class="status-badge status-danger">🚨 แจ้งเตือนอุทกภัยระดับวิกญต</div>
                    <p class="emergency-detail-text" style="font-weight: 500;">
                        ⚠️ [ประกาศเตือนภัยเร่งด่วน] ลำน้ำสายหลักมีปริมาณน้ำเกินความจุตลิ่ง ไหลเข้าท่วมพื้นที่ท้ายเขื่อนและลุ่มต่ำฉับพลัน ขอให้ประชาชนเปิดระบบเฝ้าระวังและอพยพตามแผนนิรภัยทันที!
                    </p>
                `;
            }
            
            // สั่งให้ลูกโลกแพลนกล้องไปจับที่จุดเสี่ยงภัยสีแดง (ภูเก็ต/พื้นที่ภัยพิบัติ) ทันทีเพื่อความสมจริง
            if (globeInstance) {
                globeInstance.pointOfView({ lat: 9.0, lng: 98.4, alt: 1.0 }, 1500);
            }
            
            // ส่งสัญญาณแจ้งเตือนระบบ Alert ของอุปกรณ์คอมพิวเตอร์หรือโทรศัพท์มือถือ
            alert("🚨 [METEO & ALARM CENTER]:\n\nตรวจพบสถานการณ์ภัยพิบัติอุทกภัยน้ำท่วมฉับพลันในพิกัดพื้นที่ของคุณ! ระบบได้ระบุจุดวิกฤตเป็นหมุดนีออนสีแดงบนลูกโลกแล้ว ขอให้ตรวจสอบเส้นทางและเตรียมอพยพเพื่อความปลอดภัยครับ");
        }, 1500);
    });
}

// เริ่มการประมวลผลโมดูลทั้งหมดพร้อมกันเมื่อโครงสร้างหน้าเว็บดาวน์โหลดเสร็จสิ้น
window.addEventListener('DOMContentLoaded', () => {
    initGlobeSystem();
    initAlertBroadcast();
});
