let wavesurfer;

window.addEventListener("DOMContentLoaded", () => {
  const audioInput = document.querySelector('input[type="file"][accept^="audio"]');

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
    });

    wavesurfer.load(url);

    wavesurfer.on('ready', () => {
      console.log("✅ Waveform loaded!");
    });
  });
});
