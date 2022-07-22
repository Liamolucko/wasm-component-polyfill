/**
 * Implementations of a bunch of ECMAScript intrinsics.
 * This file is JS because it does a bunch of coercive stuff which TS disallows.
 * The definitions start at https://tc39.es/ecma262/#sec-toint32.
 */

export function ToNumber(arg) {
    // This implicitly calls `ToNumber` under the hood.
    return +arg;
}

export function ToInt32(arg) {
    // This implicitly calls `ToInt32` under the hood.
    return arg >> 0;
}

export function ToUint32(arg) {
    // This implicitly calls `ToUint32` under the hood.
    return arg >>> 0;
}

export function ToInt16(arg) {
    arg >>>= 0;
    arg %= 2 ** 16;
    if (arg >= 2 ** 15) {
        arg -= 2 ** 16;
    }
    return arg;
}

export function ToUint16(arg) {
    arg >>>= 0;
    arg %= 2 ** 16;
    return arg;
}

export function ToInt8(arg) {
    arg >>>= 0;
    arg %= 2 ** 8;
    if (arg >= 2 ** 7) {
        arg -= 2 ** 8;
    }
    return arg;
}

export function ToUint8(arg) {
    arg >>>= 0;
    arg %= 2 ** 8;
    return arg;
}

export function ToBigInt64(arg) {
    return BigInt.asIntN(64, arg);
}

export function ToBigUint64(arg) {
    return BigInt.asUintN(64, arg);
}

export function ToString(arg) {
    if (typeof arg === "symbol") {
        throw new TypeError("symbols may not be passed as string values");
    } else {
        // This almost directly calls `ToString`, with the exception that it allows symbols,
        // which is why we check for them above.
        return String(arg);
    }
}
