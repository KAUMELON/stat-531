$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$courseFile=Join-Path $PSScriptRoot '../public/course.json'
$lectureCourse=Get-Content -LiteralPath $courseFile -Raw -Encoding utf8 | ConvertFrom-Json
$audioDirectory=Join-Path $PSScriptRoot '../public/audio'
New-Item -ItemType Directory -Path $audioDirectory -Force | Out-Null
$lectureVoice=New-Object System.Speech.Synthesis.SpeechSynthesizer
$lectureVoice.SelectVoice('Microsoft Zira Desktop')
$lectureVoice.Rate=-1
try {
  foreach($chapter in $lectureCourse.chapters) {
    for($slideIndex=0;$slideIndex -lt $chapter.slides.Count;$slideIndex++) {
      $clipPath=Join-Path $audioDirectory ("chapter-{0}-{1}.wav" -f $chapter.id,($slideIndex+1))
      $lectureVoice.SetOutputToWaveFile($clipPath)
      $lectureVoice.Speak([string]$chapter.slides[$slideIndex].notes)
      $lectureVoice.SetOutputToNull()
    }
    Write-Output ("Narration complete: chapter {0}" -f $chapter.id)
  }
} finally {$lectureVoice.Dispose()}
