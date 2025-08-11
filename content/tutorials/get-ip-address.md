---
title: "Get Employee Laptop IP Address for Remote Processing"
date: "2025-07-20"
slug: "get-ip-address"
---

Here’s how you can fetch an employee's laptop IP address programmatically for remote processing through intune..

```js
your google script code

function doPost(e) {
  var sheet = SpreadsheetApp.openById("your_spreadsheet").getSheetByName("IP_ADDRESS");

  var data = JSON.parse(e.postData.contents);
  var computerName = data.computerName;
  var userName = data.userName;
  var interfaces = data.interfaces; // This is an object: { "Wi-Fi": "192.168.29.173", "Ethernet": "192.168.29.167" }
  var publicIP = data.publicIP;
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss");

  // Convert interfaces object into a string for storage (e.g. JSON string or comma-separated)
  var interfacesString = JSON.stringify(interfaces);

  // Check if computerName exists, then update row, else append
  var range = sheet.getDataRange();
  var values = range.getValues();
  var found = false;

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == computerName) {
      // Update existing row
      sheet.getRange(i + 1, 1, 1, 5).setValues([[computerName, userName, interfacesString, publicIP, timestamp]]);
      found = true;
      break;
    }
  }

  if (!found) {
    // Append new row
    sheet.appendRow([computerName, userName, interfacesString, publicIP, timestamp]);
  }

  return ContentService.createTextOutput("Success");
}





###FOR WINDOWS


# Check for admin rights
If (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    $arguments = "& '" + $MyInvocation.MyCommand.Definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Exit
}

$taskName = "SendIPToGoogleSheet"
$folderPath = "C:\IPAddress"
$scriptPath = "$folderPath\SendIPToGoogleSheet.ps1"

# Create folder if it doesn't exist
if (-Not (Test-Path $folderPath)) {
    New-Item -Path $folderPath -ItemType Directory -Force | Out-Null
}

# Create or overwrite the worker script
$workerScript = @'
$webhookUrl = "https://script.google.com/macros/s/YOUR_GOOGLESCRIPTADDRESSID/exec"

$computerName = $env:COMPUTERNAME
$userName = ((Get-CimInstance -ClassName Win32_ComputerSystem).UserName).Split('\')[-1]

$interfaces = @{}

$netIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $.IPAddress -notlike '169.254.*' -and $.IPAddress -ne '127.0.0.1'
}

foreach ($ip in $netIPs) {
    $ifaceAlias = $ip.InterfaceAlias
    $ifaceIndex = $ip.InterfaceIndex
    $adapter = Get-NetAdapter -InterfaceIndex $ifaceIndex -ErrorAction SilentlyContinue
    $ifaceType = if ($adapter) { $adapter.InterfaceType } else { 0 }

    $key = "Other"
    if ($ifaceAlias -match "PPP" -or $ifaceAlias -match "mighty") {
        $key = "VPN"
    } elseif ($ifaceType -eq 71) {
        $key = "Wi-Fi"
    } elseif ($ifaceType -eq 6) {
        $key = "Ethernet"
    }

    if ($interfaces.ContainsKey($key)) {
        $interfaces[$key] += ", $($ip.IPAddress)"
    } else {
        $interfaces[$key] = $ip.IPAddress
    }
}

if ($interfaces.ContainsKey("VPN")) {
    $connectionType = "VPN"
} elseif ($interfaces.ContainsKey("Wi-Fi")) {
    $connectionType = "Wi-Fi"
} elseif ($interfaces.ContainsKey("Ethernet")) {
    $connectionType = "Ethernet"
} else {
    $connectionType = "Other"
}

try {
    $publicIP = Invoke-RestMethod -Uri "https://api.ipify.org?format=text"
} catch {
    $publicIP = "Unavailable"
}

$body = @{
    computerName   = $computerName
    userName       = $userName
    interfaces     = $interfaces
    connectionType = $connectionType
    publicIP       = $publicIP
}

$jsonBody = $body | ConvertTo-Json -Depth 5
$utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $utf8Bytes -ContentType 'application/json'

Write-Output "Sent data:"
Write-Output $jsonBody
'@

Set-Content -Path $scriptPath -Value $workerScript -Encoding UTF8

# Define expected repetition
$expectedInterval = (New-TimeSpan -Hours 1)
$expectedDuration = (New-TimeSpan -Days 365)

# Check if task already exists with correct trigger
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
$needsUpdate = $true

if ($existingTask) {
    $trigger = $existingTask.Triggers | Where-Object { $_.Repetition }
    if ($trigger -and $trigger.Repetition.Interval -eq $expectedInterval -and $trigger.Repetition.Duration -eq $expectedDuration) {
        $needsUpdate = $false
    }
}

if ($needsUpdate) {
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    $runTime = (Get-Date).AddSeconds(10)
    $trigger = New-ScheduledTaskTrigger -Once -At $runTime `
        -RepetitionInterval $expectedInterval `
        -RepetitionDuration $expectedDuration

    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "$scriptPath""

    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -User "SYSTEM" -RunLevel Highest -Force

    Write-Host "Scheduled task '$taskName' created."
} else {
    Write-Host "Scheduled task '$taskName' already exists with correct repetition. No update needed."
}



###FOR MACs

#!/bin/bash

# Create directory
mkdir -p /usr/local/IPAddress

# --------------------
# 1. Write the IP reporting script
# --------------------
cat <<'EOF' > /usr/local/IPAddress/send_ip_to_google.sh
#!/bin/bash

WEBHOOK="https://script.google.com/macros/s/YOUR_GOOGLESCRIPTADDRESSID/exec"

COMPUTER_NAME=$(scutil --get ComputerName)
USER_NAME=$(whoami)
PUBLIC_IP=$(curl -s https://api.ipify.org)

interfaces_json="{"
first=true

# Wi-Fi IP (en0)
WIFI_IP=$(ipconfig getifaddr en0 2>/dev/null)
if [[ -n "$WIFI_IP" ]]; then
  interfaces_json+="\"Wi-Fi\":\"$WIFI_IP\""
  first=false
fi

# VPN IP from ppp0 or utun*
for iface in ppp0 utun0 utun1 utun2 utun3 utun4 utun5 utun6 utun7; do
  ip=$(ifconfig "$iface" 2>/dev/null | grep "inet " | awk '{print $2}')
  if [[ -n "$ip" ]]; then
    if ! $first; then
      interfaces_json+=", "
    fi
    interfaces_json+="\"VPN\":\"$ip\""
    break
  fi
done

interfaces_json+="}"

JSON=$(cat <<EOF2
{
  "computerName": "$COMPUTER_NAME",
  "userName": "$USER_NAME",
  "interfaces": $interfaces_json,
  "connectionType": "macOS",
  "publicIP": "$PUBLIC_IP"
}
EOF2
)

curl -s -X POST -H "Content-Type: application/json" -d "$JSON" "$WEBHOOK"
echo "Sent JSON: $JSON"
EOF

# --------------------
# 2. Make it executable
# --------------------
chmod +x /usr/local/IPAddress/send_ip_to_google.sh

# --------------------
# 3. Create LaunchDaemon to run every 5 mins
# --------------------
cat <<EOF > /Library/LaunchDaemons/com.company.SendIPToGoogleSheet.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.company.SendIPToGoogleSheet</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/local/IPAddress/send_ip_to_google.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/send_ip_to_google.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/send_ip_to_google.err</string>
  </dict>
</plist>
EOF

# --------------------
# 4. Set permissions and load
# --------------------
chown root:wheel /Library/LaunchDaemons/com.company.SendIPToGoogleSheet.plist
chmod 644 /Library/LaunchDaemons/com.company.SendIPToGoogleSheet.plist

# Unload if already exists, then load
launchctl unload /Library/LaunchDaemons/com.company.SendIPToGoogleSheet.plist 2>/dev/null
launchctl load /Library/LaunchDaemons/com.company.SendIPToGoogleSheet.plist

echo "✅ Installed and scheduled. Script will run every 1 hr."


