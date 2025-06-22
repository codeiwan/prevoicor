let wavesurfer;
let activeRegion = null;
let regionCount = 1;
let selectedSegmentId = null;
const savedRegions = [];

window.addEventListener("DOMContentLoaded", () => {
  const audioInput = document.querySelector('input[type="file"][accept^="audio"]');
  const addSegmentBtn = document.getElementById("add-segment-btn");
  const saveSegmentBtn = document.getElementById("save-segment-btn");
  const playSegmentBtn = document.getElementById("play-segment-btn");
  const segmentList = document.querySelector(".segment-list");
  const transcriptBox = document.querySelector("textarea");
  const transcriptionBox = document.querySelector(".transcription-box");
  const closeTranscriptionBtn = document.getElementById("close-transcription");

  // 상태 초기화 함수
  function updateButtonVisibility(regionActive) {
    if (!addSegmentBtn || !saveSegmentBtn || !playSegmentBtn || !transcriptionBox) return;
    
    if (regionActive) {
      addSegmentBtn.style.display = "none";
      saveSegmentBtn.style.display = "inline-block";
      playSegmentBtn.style.display = "inline-block";
      transcriptionBox.style.display = "block";
    } else {
      addSegmentBtn.style.display = "inline-block";
      saveSegmentBtn.style.display = "none";
      playSegmentBtn.style.display = "none";
      transcriptionBox.style.display = "none";
    }
  }

  updateButtonVisibility(false); // 처음에는 숨겨둠

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

  // Add Segment → region 생성 + UI 전환
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
    selectedSegmentId = null;
    clearSelectedClass();
    updateButtonVisibility(true); // UI 전환
  });

  // Save Segment → 수정 or 새로 추가
  saveSegmentBtn.addEventListener("click", () => {
    if (!activeRegion) return;

    const start = activeRegion.start.toFixed(2);
    const end = activeRegion.end.toFixed(2);
    const text = transcriptBox.value.trim();

    if (selectedSegmentId) {
      // 수정
      const seg = savedRegions.find(r => r.id === selectedSegmentId);
      if (seg) {
        seg.start = parseFloat(start);
        seg.end = parseFloat(end);
        seg.text = text;

        const existingItem = segmentList.querySelector(`[data-id="${selectedSegmentId}"]`);
        if (existingItem) {
          existingItem.textContent = `Segment ${seg.id.replace("segment-", "")} — ${start}s ~ ${end}s`;
        }
      }
    } else {
      // 추가
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
    updateButtonVisibility(false); // UI 복원
  });

  // Segment 항목 클릭 시 region 재생성 + UI 전환
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
    item.classList.add("selected");
    updateButtonVisibility(true); // UI 전환
  });

  // ❌ 닫기 버튼 → region 제거 + UI 복원
  closeTranscriptionBtn.addEventListener("click", () => {
    if (activeRegion) {
      activeRegion.remove();
      activeRegion = null;
    }

    transcriptBox.value = "";
    selectedSegmentId = null;
    clearSelectedClass();
    updateButtonVisibility(false);
  });

  // Play Segment 버튼 → region 재생
  playSegmentBtn.addEventListener("click", () => {
    if (activeRegion && wavesurfer) {
      wavesurfer.play(activeRegion.start, activeRegion.end);
    }
  });

  function clearSelectedClass() {
    segmentList.querySelectorAll(".segment-item.selected").forEach(el => {
      el.classList.remove("selected");
    });
  }
});
