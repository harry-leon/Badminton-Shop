@echo off
echo ===================================================
echo  BADMINTON SHOP MONOREPO - FULL TEST SUITE RUNNER
echo ===================================================

node test/test-suite.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Test suite failed!
    exit /b %ERRORLEVEL%
)

echo [SUCCESS] Toan bo test suite da PASS 100%!
