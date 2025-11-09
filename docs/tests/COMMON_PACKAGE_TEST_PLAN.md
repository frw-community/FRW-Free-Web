# Common Package Test Plan

## Test Status: Ready to Create

### Files to Test:
1. [OK] **constants.ts** - Simple exports, low priority
2. [HOT] **errors.ts** - Critical error classes
3. [HOT] **utils.ts** - Core utility functions (HIGH PRIORITY)
4. [OK] **types.ts** - TypeScript interfaces, no logic

### Priority Tests for utils.ts (63 lines, 12 functions):

**High Priority:**
1. `isValidFRWURL()` - URL validation
2. `isValidPublicKey()` - Key validation  
3. `extractMetadata()` - HTML parsing
4. `canonicalize()` - **CRITICAL** - Has same signature removal as crypto!
5. `validateVersion()` - Version string validation
6. `validateDateISO()` - Date validation
7. `isHTML()` - Content type detection

**Medium Priority:**
8. `formatBytes()` - Display formatting
9. `sanitizePath()` - Path normalization
10. `extractAllMetadata()` - Batch metadata extraction

**Low Priority:**
11. `sleep()` - Simple Promise wrapper

### Critical Issue Found!

**Line 19 in utils.ts:**
```typescript
.replace(/<meta name="frw-signature" content="[^"]+">\s*/g, '')
```

This has the SAME BUG we just fixed in crypto/signatures.ts!
- Uses `\s*` which matches newlines
- Should use `[ \t]*` to preserve document structure

**Recommendation:** Fix this FIRST before creating tests!

### Test Count Estimate:
- **errors.ts**: ~15 tests (error classes, inheritance, properties)
- **utils.ts**: ~40 tests (each function + edge cases)
- **Total**: ~55 comprehensive tests

### Next Steps:
1. Fix `canonicalize()` regex bug
2. Create Jest config
3. Create comprehensive test suites
4. Run tests and verify code correctness
