# setup-nightly-task.ps1
# Creates a Windows Task Scheduler task to run consolidate-memory.py every night at 02:00.
# Run once as Administrator: powershell -ExecutionPolicy Bypass -File scripts\setup-nightly-task.ps1

$TaskName    = "MemoriaShare-ConsolidateMemory"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ScriptPath  = Join-Path $ProjectRoot "scripts\consolidate-memory.py"
$PythonExe   = (Get-Command python -ErrorAction SilentlyContinue)?.Source ?? "python"
$LogFile     = Join-Path $ProjectRoot "scripts\consolidate-memory.log"

# Verify python exists
if (-not (Test-Path $PythonExe -ErrorAction SilentlyContinue)) {
    # Try python3 fallback
    $PythonExe = (Get-Command python3 -ErrorAction SilentlyContinue)?.Source
    if (-not $PythonExe) {
        Write-Error "Python not found. Install Python 3.8+ and ensure it's in PATH."
        exit 1
    }
}

# Verify anthropic package
$hasAnthropicPkg = & $PythonExe -c "import anthropic" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing anthropic package..."
    & $PythonExe -m pip install anthropic --quiet
}

# Build the action: python script >> log 2>&1
$Action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$PythonExe`" `"$ScriptPath`" >> `"$LogFile`" 2>&1" `
    -WorkingDirectory $ProjectRoot

# Trigger: daily at 02:00
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00"

# Settings: run even if on battery, wake computer
$Settings = New-ScheduledTaskSettingsSet `
    -DisallowStartIfOnBatteries $false `
    -StopIfGoingOnBatteries $false `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# Principal: run as current user
$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

# Remove existing task if present
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Register
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal `
    -Description "Consolidates Claude conversation logs into memory/. See MemoriaShare/skills/consolidate-memory/SKILL.md" `
    | Out-Null

Write-Host ""
Write-Host "✅ Scheduled task '$TaskName' created."
Write-Host "   Schedule : Daily at 02:00"
Write-Host "   Script   : $ScriptPath"
Write-Host "   Log      : $LogFile"
Write-Host ""
Write-Host "⚠️  Make sure ANTHROPIC_API_KEY is set as a system/user environment variable:"
Write-Host "   [System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'sk-ant-...', 'User')"
Write-Host ""
Write-Host "Run now to test:"
Write-Host "   Start-ScheduledTask -TaskName '$TaskName'"
