#!/bin/sh -e

# Prints a fresh 32-byte random secret as hex. Use for any shared secret the app
# needs — SESSION_SECRET, HONEYPOT_SECRET, or a script's OWN_SECRET that must
# match GAS_EDITORIAL_BOARD_SECRET / GAS_EDITORIAL_BOARD_MEMBERSHIP_SECRET /
# GAS_MAGIC_LINK_SECRET / GAS_USERS_NOTICE_SECRET, or the Membership script's
# LINK_SECRET that must match GAS_EDITORIAL_BOARD_LINK_SECRET.
exec openssl rand -hex 32
