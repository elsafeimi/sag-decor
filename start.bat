@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  S.A.G Decor - duke u nisur...
echo.
if not exist node_modules (
  echo Duke instaluar pjeset e nevojshme, prit nje minute...
  call npm.cmd install
)
if "%ADMIN_PASSWORD%"=="" set /p ADMIN_PASSWORD=Shkruaj nje fjalekalim per panelin e adminit dhe shtyp Enter: 
echo.
echo Faqja hapet ne shfletues. MOS e mbyll kete dritare gjate punes.
echo Admin: http://localhost:3000/admin  (perdorues: admin)
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
node server.js
pause
