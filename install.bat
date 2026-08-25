@echo off
setlocal EnableDelayedExpansion
title MolKanvas - Cai dat
color 0A
chcp 65001 >nul

echo.
echo  ================================================================
echo     MolKanvas v1.0  ^|  by Manh-Son Nguyen
echo     Phan mem ve cau truc hoa hoc chuyen nghiep
echo  ================================================================
echo.

:: ── [1] Kiem tra Node.js ─────────────────────────────────────────
echo  [1/5] Kiem tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [LOI] Khong tim thay Node.js!
    echo  Vui long cai dat Node.js v18+ tai: https://nodejs.org
    echo  Sau do chay lai file nay.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER%

:: ── [2] Kiem tra Python ──────────────────────────────────────────
echo.
echo  [2/5] Kiem tra Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    python3 --version >nul 2>&1
    if !errorlevel! equ 0 (
        set PYTHON_CMD=python3
    ) else (
        echo.
        echo  [LOI] Khong tim thay Python!
        echo  Cai dat Python 3.10+ tai: https://www.python.org
        echo  Khi cai nho tick chon "Add Python to PATH".
        echo  Sau do chay lai file nay.
        echo.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%i in ('%PYTHON_CMD% --version') do set PY_VER=%%i
echo  [OK] %PY_VER%

:: ── [3] Tao Python venv va cai RDKit ────────────────────────────
echo.
echo  [3/5] Cai dat Python RDKit (lan dau ~3-5 phut)...

if not exist "ocr\.venv" (
    echo  Dang tao virtual environment...
    %PYTHON_CMD% -m venv ocr\.venv
    if !errorlevel! neq 0 (
        echo  [LOI] Khong the tao Python virtual environment.
        pause
        exit /b 1
    )
)

echo  Dang cap nhat pip...
ocr\.venv\Scripts\pip.exe install --upgrade pip -q

echo  Dang cai RDKit (co the mat vai phut)...
ocr\.venv\Scripts\pip.exe install rdkit -q
if %errorlevel% neq 0 (
    echo  [LOI] Cai RDKit that bai. Kiem tra ket noi mang.
    pause
    exit /b 1
)
echo  [OK] RDKit da san sang

:: ── [4] Cai Node packages ────────────────────────────────────────
echo.
echo  [4/5] Cai dat Node.js packages...
call npm install
if %errorlevel% neq 0 (
    echo  [LOI] npm install that bai.
    pause
    exit /b 1
)
echo  [OK] Node packages da cai xong

:: ── [5] Tao file start.bat ───────────────────────────────────────
echo.
echo  [5/5] Tao file start.bat...
(
    echo @echo off
    echo title MolKanvas
    echo cd /d "%%~dp0"
    echo npm run app:dev
) > start.bat
echo  [OK] start.bat da tao

:: ── Hoan thanh ───────────────────────────────────────────────────
echo.
echo  ================================================================
echo   CAI DAT HOAN TAT!
echo.
echo   Lan sau: chi can double-click  start.bat  de mo app.
echo  ================================================================
echo.
echo  Dang khoi dong MolKanvas lan dau...
echo.
timeout /t 3 /nobreak >nul

start cmd /k "npm run app:dev"

echo.
echo  App dang mo trong cua so moi.
echo  Ban co the dong cua so nay.
echo.
pause
