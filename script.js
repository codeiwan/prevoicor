let wavesurfer;
let activeRegion = null;
let regionCount = 1;
let selectedSegmentId = null;
const savedRegions = [];

window.addEventListener("DOMContentLoaded", () => {
  const audioInput = document.querySelector('input[type="file"][accept^="audio"]');
  const addSegmentBtn = document.querySelector("button.btn-outline-success");
  const saveSegmentBtn = document.querySelector("button.btn-primary");
  const segmentList = document.querySelector(".segment-list");
  const transcriptBox = document.querySelector("textarea");

  // 오디오 업로드
  audioInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (wavesurfer) {
      wavesurfer.destroy();
    }

    wavesurfer = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#888",
      progressColor: "#4caf50",
      height: 200,
      responsive: true,
      minPxPerSec: 100,
      plugins: [WaveSurfer.regions.create()]
    });

    wavesurfer.load(url);
    wavesurfer.on("ready", () => {
      console.log("✅ Waveform loaded!");
    });
  });

  // Add Segment → region만 생성
  addSegmentBtn.addEventListener("click", () => {
    if (!wavesurfer) return;

    if (activeRegion) {
      activeRegion.remove();
    }

    activeRegion = wavesurfer.addRegion({
      start: wavesurfer.getCurrentTime(),
      end: wavesurfer.getCurrentTime() + 2,
      color: "rgba(76, 175, 80, 0.3)"
    });

    transcriptBox.value = "";
    selectedSegmentId = null; // 새로 만드는 거니까 기존 선택 해제
    clearSelectedClass();     // 시각적 강조도 해제
  });

  // Save Segment → 새로 추가 또는 기존 수정
  saveSegmentBtn.addEventListener("click", () => {
    if (!activeRegion) return;

    const start = activeRegion.start.toFixed(2);
    const end = activeRegion.end.toFixed(2);
    const text = transcriptBox.value.trim();

    if (selectedSegmentId) {
      // ✅ 수정 모드
      const seg = savedRegions.find(r => r.id === selectedSegmentId);
      if (seg) {
        seg.start = parseFloat(start);
        seg.end = parseFloat(end);
        seg.text = text;

        // 화면 텍스트도 업데이트
        const existingItem = segmentList.querySelector(`[data-id="${selectedSegmentId}"]`);
        if (existingItem) {
          existingItem.textContent = `Segment ${seg.id.replace("segment-", "")} — ${start}s ~ ${end}s`;
        }
      }
    } else {
      // ✅ 새로 추가
      const segmentId = `segment-${regionCount}`;
      const item = document.createElement("div");
      item.className = "segment-item";
      item.textContent = `Segment ${regionCount} — ${start}s ~ ${end}s`;
      item.dataset.id = segmentId;
      segmentList.appendChild(item);

      savedRegions.push({
        id: segmentId,
        start: parseFloat(start),
        end: parseFloat(end),
        text: text
      });

      regionCount++;
    }

    activeRegion.remove();
    activeRegion = null;
    transcriptBox.value = "";
    selectedSegmentId = null;
    clearSelectedClass();
  });

  // Segment 클릭 시 → region 복원 + 텍스트 표시 + 강조
  segmentList.addEventListener("click", (e) => {
    const item = e.target.closest(".segment-item");
    if (!item) return;

    const id = item.dataset.id;
    const seg = savedRegions.find(r => r.id === id);
    if (!seg || !wavesurfer) return;

    if (activeRegion) {
      activeRegion.remove();
    }

    activeRegion = wavesurfer.addRegion({
      start: seg.start,
      end: seg.end,
      color: "rgba(76, 175, 80, 0.3)"
    });

    transcriptBox.value = seg.text;
    selectedSegmentId = id;

    clearSelectedClass();
    item.classList.add("selected"); // ✅ 시각적 강조
  });

  // helper: 이전 선택 해제
  function clearSelectedClass() {
    segmentList.querySelectorAll(".segment-item.selected").forEach(el => {
      el.classList.remove("selected");
    });
  }
});
