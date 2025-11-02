#!/usr/bin/env bash
set -e
# Пример: использует llama.cpp tools/convert/quantize (варианты зависят от сборки)
BASE_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
LLAMA_REPO="$BASE_DIR/repos/llama.cpp"
MODEL_IN="$1"
MODEL_OUT="$2"
QTYPE="${3:-q4_0}"

if [ -z "$MODEL_IN" ] || [ -z "$MODEL_OUT" ]; then
  echo "Usage: quantize.sh <in> <out> [qtype]"
  exit 1
fi

if [ ! -f "$LLAMA_REPO/tools/quantize/quantize" ]; then
  echo "quantize tool not found. Check llama.cpp build and tools/quantize."
fi

"$LLAMA_REPO/tools/quantize/quantize" "$MODEL_IN" "$MODEL_OUT" "$QTYPE"
echo "Quantized\u00A0to\u00A0$MODEL_OUT"
