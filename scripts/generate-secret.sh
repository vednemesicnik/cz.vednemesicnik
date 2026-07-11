#!/bin/sh -e

# Prints a fresh 32-byte random secret as hex. Use for any shared secret the app
# needs — SESSION_SECRET, HONEYPOT_SECRET, or the GAS SHARED_SECRET that must
# match GAS_EDITORIAL_BOARD_SECRET / GAS_MAGIC_LINK_SECRET.
exec openssl rand -hex 32
