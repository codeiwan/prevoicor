let wavesurfer;
let activeRegion = null;
let regionCount = 1;

window.addEventListener("DOMContentLoaded", () => {
  const audioInput = document.querySelector('input[type="file"][accept^="audio"]');
  const addSegmentBtn = document.querySelector("button.btn-outline-success");
  const saveSegmentBtn = document.querySelector("button.btn-primary");
  const segmentList = document.querySelector(".segment-list");
  const transcriptBox = document.querySelector("textarea");

  // 오디오 파일 업로드 시 파형 표시
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
      plugins: [
        WaveSurfer.regions.create()
      ]
    });

    wavesurfer.load(url);

    wavesurfer.on("ready", () => {
      console.log("✅ Waveform loaded!");
    });
  });

  // + Add Segment 클릭 → region 생성
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

    transcriptBox.value = ""; // 텍스트 초기화
  });

  // Save Segment 클릭 → 리스트에 저장
  saveSegmentBtn.addEventListener("click", () => {
    if (!activeRegion) return;

    const start = activeRegion.start.toFixed(2);
    const end = activeRegion.end.toFixed(2);
    const text = transcriptBox.value.trim();

    const item = document.createElement("div");
    item.className = "segment-item";
    item.textContent = `Segment ${regionCount} — ${start}s ~ ${end}s`;
    segmentList.appendChild(item);

    // region에 메타데이터 저장 (나중에 export용으로 활용)
    activeRegion.data = {
      id: regionCount,
      text: text
    };

    activeRegion.remove();  // 화면에서 제거

    regionCount++;
    activeRegion = null;
    transcriptBox.value = ""; // 입력란 초기화
  });
});
