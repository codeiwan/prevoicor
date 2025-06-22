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

    const start = Math.round(activeRegion.start * 100) / 100;
    const end = Math.round(activeRegion.end * 100) / 100;
    const transcript = transcriptBox.value.trim();

    if (selectedSegmentId) {
      // ✅ 기존 segment 수정
      const existing = savedRegions.find(r => r.id === selectedSegmentId);
      if (existing) {
        existing.start = start;
        existing.end = end;
        existing.text = transcript;

        // 리스트 항목 업데이트
        const listItem = document.querySelector(`.segment-item[data-id="${selectedSegmentId}"]`);
        if (listItem) {
          listItem.querySelector("span").textContent = `Segment ${existing.id.split("-")[1]} — ${start}s ~ ${end}s`;
        }

        if (activeRegion) {
          activeRegion.remove();
          activeRegion = null;
        }

        transcriptBox.value = "";
        selectedSegmentId = null;
        clearSelectedClass();
        updateButtonVisibility(false);
      }
    } else {
      // ✅ 새 segment 추가
      const segmentId = `segment-${regionCount}`;
      const segmentData = {
        id: segmentId,
        start,
        end,
        text: transcript
      };
      savedRegions.push(segmentData);

      const item = document.createElement("div");
      item.className = "segment-item";
      item.dataset.id = segmentId;

      const label = document.createElement("span");
      label.textContent = `Segment ${regionCount} — ${start}s ~ ${end}s`;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "❌";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = savedRegions.findIndex(r => r.id === segmentId);
        if (idx !== -1) savedRegions.splice(idx, 1);
        item.remove();
        if (activeRegion) {
          activeRegion.remove();
          activeRegion = null;
        }
        transcriptBox.value = "";
        selectedSegmentId = null;
        clearSelectedClass();
        updateButtonVisibility(false);
      });

      item.addEventListener("click", () => {
        clearSelectedClass();
        item.classList.add("selected");
        selectedSegmentId = segmentId;
        const regionData = savedRegions.find(r => r.id === segmentId);
        if (regionData) {
          if (activeRegion) activeRegion.remove();
          activeRegion = wavesurfer.addRegion({
            start: regionData.start,
            end: regionData.end,
            color: "rgba(0, 255, 0, 0.3)"
          });
          transcriptBox.value = regionData.text || "";
          updateButtonVisibility(true);
        }
      });

      item.appendChild(label);
      item.appendChild(deleteBtn);
      segmentList.appendChild(item);

      regionCount++;
      transcriptBox.value = "";
      if (activeRegion) {
        activeRegion.remove();
        activeRegion = null;
      }
      updateButtonVisibility(false);
    }
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
