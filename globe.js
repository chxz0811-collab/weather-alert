/* ==========================================================================
   MODULE: GLOBE CONTROLLER (ระบบจัดการลูกโลก 3 มิติ สไตล์ White Luxury)
   ========================================================================== */

const weatherDatabase = {
    TH: {
        name: "ประเทศไทย", center: [13.7563, 100.5018],
        provinces: {
            bangkok: { name: "กรุงเทพมหานคร", temp: "31°C", sky: "🌤️ มีเมฆบางส่วน", humid: "68%", wind: "ลมใต้ 12 กม./ชม.", status: "ปกติ" },
            chiangmai: { name: "เชียงใหม่", temp: "24°C", sky: "🌫️ หมอกหนา", humid: "85%", wind: "ลมเหนือ 5 กม./ชม.", status: "ปกติ" },
            phuket: { name: "ภูเก็ต", temp: "29°C", sky: "⛈️ ฝนฟ้าคะนอง", humid: "92%", wind: "มรสุม 25 กม./ชม.", status: "เฝ้าระวังน้ำท่วม" }
        }
    },
    JP: {
        name: "ประเทศญี่ปุ่น", center: [35.6762, 139.6503],
        provinces: {
            tokyo: { name: "โตเกียว", temp: "16°C", sky: "☀️ ฟ้าโปร่ง", humid: "45%", wind: "ลมตะวันออก 8 กม./ชม.", status: "ปกติ" }
        }
    }
};

let globeInstance;

function initGlobe() {
    const container = document.getElementById('globe-container');
    if (!container) return;

    // 🛠️ แก้ไขจุดนี้: ใช้สีเนื้อลูกโลกแทนการดึงรูปภาพ เพื่อให้ดับเบิ้ลคลิกเปิดในคอมได้ทันที
    globeInstance = Globe()
        (container)
        .showGlobe(true)
        .globeColor('rgba(230, 235, 245, 0.9)') // ผิวลูกโลกสีขาวนวลสะอาดตา
        .backgroundColor('#f8f9fa')             // พื้นหลังคลีนมินิมอล
        .showAtmosphere(true)                  // เปิดชั้นบรรยากาศ
        .atmosphereColor('#cbd5e1')            // ออร่าชั้นบรรยากาศสีฟ้าเทาอ่อน
        .atmosphereDaylightAlpha(0.2);

    function handleResize() {
        globeInstance.width(container.offsetWidth);
        globeInstance.height(window.innerHeight);
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    document.getElementById('country-select').addEventListener('change', handleCountryChange);
    document.getElementById('province-select').addEventListener('change', handleProvinceChange);

    handleCountryChange();
}

function handleCountryChange() {
    const countryKey = document.getElementById('country-select').value;
    const provinceSelect = document.getElementById('province-select');
    const countryData = weatherDatabase[countryKey];
    
    if (!countryData) return;
    provinceSelect.innerHTML = '<option value="">เลือกจังหวัด / เมืองย่อย</option>';
    
    globeInstance.pointOfView({ lat: countryData.center, lng: countryData.center, alt: 1.5 }, 2000);

    Object.keys(countryData.provinces).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.innerText = countryData.provinces[key].name;
        provinceSelect.appendChild(opt);
    });

    // สร้างหมุดสามมิติระบุตำแหน่งสถานีตรวจวัดอากาศ
    const markers = Object.keys(countryData.provinces).map(key => {
        return {
            lat: countryData.center + (Math.random() - 0.5) * 2,
            lng: countryData.center + (Math.random() - 0.5) * 2,
            size: 0.4,
            color: '#4a5568'
        }
    });
    
    globeInstance.pointsData(markers).pointAltitude(0.04).pointColor('color').pointRadius(0.18);
}

function handleProvinceChange() {
    const countryKey = document.getElementById('country-select').value;
    const provinceKey = document.getElementById('province-select').value;
    const panel = document.getElementById('weather-panel');
    
    if (!provinceKey) {
        panel.innerHTML = '<p class="placeholder-text">กรุณาเลือกพื้นที่บนลูกโลก...</p>';
        return;
    }
    
    const data = weatherDatabase[countryKey].provinces[provinceKey];
    
    panel.innerHTML = `
        <div style="font-size: 15px; font-weight: 600; margin-top: 10px;">📍 ${data.name}</div>
        <div style="display: flex; align-items: baseline; gap: 10px; margin: 5px 0;">
            <div style="font-size: 34px; font-weight: 300; letter-spacing: -1px;">${data.temp}</div>
            <div style="font-size: 14px; color: var(--text-muted);">${data.sky}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: rgba(255,255,255,0.6); border: 1px solid var(--border-line); padding: 8px; border-radius: 12px;">
                <div style="font-size: 10px; color: var(--text-muted);">💨 กระแสลม</div>
                <div style="font-size: 12px; font-weight: 500;">${data.wind}</div>
            </div>
            <div style="background: rgba(255,255,255,0.6); border: 1px solid var(--border-line); padding: 8px; border-radius: 12px;">
                <div style="font-size: 10px; color: var(--text-muted);">⚠️ สถานะภัย</div>
                <div style="font-size: 12px; font-weight: 500; color: #dd6b20;">${data.status}</div>
            </div>
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', initGlobe);
