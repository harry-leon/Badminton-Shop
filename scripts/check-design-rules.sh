#!/usr/bin/env bash
# Script kiểm tra quy tắc thiết kế Quiet Court cho storefront chạy trong CI
# Quét mã nguồn frontend/src/app (loại trừ admin) và báo lỗi khi gặp class cấm

set -e

node "$(dirname "$0")/check-design-rules.js" "$@"
