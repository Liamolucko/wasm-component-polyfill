import { ResolvedCanonOpts } from "../parser/mod.ts";
import { ToString } from "./intrinsics.js";
import { StackLowerer } from "./mod.ts";

const MAX_STRING_BYTE_LENGTH = (1 << 31) - 1;
const longStringError = new Error(
  `unable to lower string longer than maximum byte length of ${MAX_STRING_BYTE_LENGTH}`,
);

const textEncoder = new TextEncoder();

export function stackStringLowerer(opts: ResolvedCanonOpts): StackLowerer {
  let writer: Writer;
  switch (opts.stringEncoding) {
    case "utf8":
      writer = utf8Writer(opts);
      break;
    case "utf16":
      writer = utf16Writer(opts);
      break;
    case "latin1-plus-utf16":
      writer = latin1OrUtf16Writer(opts);
      break;
  }
  return (out, x) => {
    const s = ToString(x);
    const [ptr, size] = writer(s);
    out.push(ptr, size);
  }
}

type Writer = (s: string) => [number, number];

function utf8Writer(opts: ResolvedCanonOpts): Writer {
  return (s) => {
    const bestCaseSize = s.length;
    const worstCaseSize = 3 * s.length;

    if (bestCaseSize > MAX_STRING_BYTE_LENGTH) {
      throw longStringError;
    }

    // Note: the validator ensures that this is present if it's needed.
    let ptr = opts.realloc!(0, 0, 1, bestCaseSize);
    const result = textEncoder.encodeInto(
      s,
      // Note: we do have to re-fetch this buffer every time, because calling
      // `realloc` might grow the memory and invalidate it.
      new Uint8Array(opts.memory!.buffer, ptr, bestCaseSize),
    );

    let encodedSize = result.written;

    if (result.read < s.length) {
      // The allocation was too small, reallocate to the worst-case size and finish off.
      if (worstCaseSize > MAX_STRING_BYTE_LENGTH) {
        throw new Error(
          `unable to lower string longer than maximum byte length of ${MAX_STRING_BYTE_LENGTH}`,
        );
      }

      ptr = opts.realloc!(ptr, bestCaseSize, 1, worstCaseSize);

      const result2 = textEncoder.encodeInto(
        s.slice(result.read),
        new Uint8Array(
          opts.memory!.buffer,
          ptr + result.written,
          worstCaseSize - result.written,
        ),
      );

      encodedSize += result2.written;

      if (encodedSize < worstCaseSize) {
        // Shrink the allocation to the actual encoded size.
        opts.realloc!(ptr, worstCaseSize, 1, encodedSize);
      }
    }

    return [ptr, encodedSize];
  };
}

/** Encodes `s` into `view` as little-endian UTF-16. */
function encodeUtf16(s: string, view: DataView) {
  enum CodeUnitKind {
    Complete,
    LeadingSurrogate,
    TrailingSurrogate,
  }

  function classifyCodeUnit(codeUnit: number) {
    if (codeUnit < 0xD800) {
      return CodeUnitKind.Complete;
    } else if (codeUnit < 0xDC00) {
      return CodeUnitKind.LeadingSurrogate;
    } else if (codeUnit < 0xE000) {
      return CodeUnitKind.TrailingSurrogate;
    } else {
      return CodeUnitKind.Complete;
    }
  }

  let i = 0;
  while (i < s.length) {
    let codeUnit = s.charCodeAt(i);
    const codeUnitKind = classifyCodeUnit(codeUnit);
    if (codeUnitKind === CodeUnitKind.TrailingSurrogate) {
      // unpaired surrogate
      codeUnit = 0xFFFD;
    } else if (codeUnitKind === CodeUnitKind.LeadingSurrogate) {
      const nextCodeUnit = s.charCodeAt(i + 1);
      if (
        Number.isNaN(nextCodeUnit) ||
        classifyCodeUnit(nextCodeUnit) !== CodeUnitKind.TrailingSurrogate
      ) {
        // unpaired surrogate
        codeUnit = 0xFFFD;
      }
    }

    // Write out the code unit.
    view.setUint16(i * 2, codeUnit, true);

    i += 1;
  }
}

function utf16Writer(opts: ResolvedCanonOpts): Writer {
  return (s) => {
    const byteLength = 2 * s.length;

    if (byteLength > MAX_STRING_BYTE_LENGTH) {
      throw longStringError;
    }

    const ptr = opts.realloc!(0, 0, 2, byteLength);
    const view = new DataView(opts.memory!.buffer, ptr, byteLength);

    encodeUtf16(s, view);

    return [ptr, byteLength];
  };
}

function latin1OrUtf16Writer(opts: ResolvedCanonOpts): Writer {
  return (s) => {
    // In the best-case scenario, all of the characters fit into Latin-1.
    const bestCaseSize = s.length;
    // Otherwise we have to use UTF-16.
    const worstCaseSize = 2 * s.length;

    if (bestCaseSize > MAX_STRING_BYTE_LENGTH) {
      throw longStringError;
    }

    let size = bestCaseSize;

    let ptr = opts.realloc!(0, 0, 2, bestCaseSize);
    const view = new Uint8Array(opts.memory!.buffer, ptr, bestCaseSize);

    for (let i = 0; i < s.length; i++) {
      const codeUnit = s.charCodeAt(i);
      if (codeUnit < 256) {
        // It fits into Latin-1, keep going.
        view[i] = codeUnit;
      } else {
        // It doesn't fit into Latin-1, we have to use UTF-16.
        if (worstCaseSize > MAX_STRING_BYTE_LENGTH) {
          throw longStringError;
        }

        size = worstCaseSize;

        // Reallocate our buffer to be able to fit it.
        ptr = opts.realloc!(ptr, bestCaseSize, 2, worstCaseSize);
        const view = new DataView(opts.memory!.buffer, ptr, worstCaseSize);

        // Inflate all the Latin-1 we already wrote into UTF-16.
        for (let j = i - 1; j >= 0; j--) {
          view.setUint16(j * 2, view.getUint8(j), true);
        }

        // Then encode the rest.
        // Make a new `DataView` which points at the unwritten section.
        const remainingView = new DataView(
          opts.memory!.buffer,
          ptr + i * 2,
          worstCaseSize - i * 2,
        );

        // Then call out to our UTF-16 encoder.
        encodeUtf16(s.slice(i), remainingView);

        break;
      }
    }

    return [ptr, size];
  };
}
