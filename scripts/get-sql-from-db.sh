#!/bin/sh -ex

sqlite3 prisma/sqlite.db .dump > prisma/sqlite.sql
