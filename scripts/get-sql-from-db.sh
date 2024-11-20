#!/bin/sh -ex

sqlite3 prisma/data.db .dump > prisma/data.sql
