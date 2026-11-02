@echo off
title Koneksi Database Akuntansi (Cloudflare Tunnel)
setlocal

set HOSTNAME=akuntansi-db.klinikmuhammadiyahkedungadem.id
set LOCAL_PORT=15432

where cloudflared >nul 2>nul
if errorlevel 1 (
    echo [ERROR] cloudflared belum terinstall atau tidak ada di PATH.
    echo Install dengan perintah: winget install --id Cloudflare.cloudflared
    echo.
    pause
    exit /b 1
)

echo ==========================================================
echo   KONEKSI DATABASE AKUNTANSI VIA CLOUDFLARE TUNNEL
echo ==========================================================
echo   Hostname : %HOSTNAME%
echo.
echo   Pengaturan DBeaver / pgAdmin:
echo     Host     : 127.0.0.1
echo     Port     : %LOCAL_PORT%
echo     Database : akuntansi_db
echo     Username : postgres
echo     Password : (sesuai .env di server)
echo.
echo   JANGAN TUTUP JENDELA INI selama memakai database.
echo   Tekan Ctrl+C untuk memutus koneksi.
echo ==========================================================
echo.

cloudflared access tcp --hostname %HOSTNAME% --url 127.0.0.1:%LOCAL_PORT%

echo.
echo Koneksi terputus.
pause
endlocal

