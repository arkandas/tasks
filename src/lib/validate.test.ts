import { describe, expect, it } from 'vitest';
import {
  isEmail,
  isPriority,
  isStickyNoteColor,
  isUserRole,
  isValidOptionalText,
  moveItem,
  optionalText,
  parseId,
  parseIndex,
  parseOptionalDate,
  requiredText,
} from './validate';

describe('parseId', () => {
  it('accepts positive integers, as numbers or strings', () => {
    expect(parseId(7)).toBe(7);
    expect(parseId('42')).toBe(42);
  });

  it('rejects everything that cannot be a row id', () => {
    for (const value of ['abc', '', ' ', '1.5', 0, -3, 2.5, null, undefined, {}, NaN]) {
      expect(parseId(value)).toBeNull();
    }
  });
});

describe('parseIndex', () => {
  it('accepts zero and positive integers', () => {
    expect(parseIndex(0)).toBe(0);
    expect(parseIndex('3')).toBe(3);
  });

  it('rejects negatives, fractions and junk', () => {
    for (const value of [-1, '1.5', 'x', null, undefined]) {
      expect(parseIndex(value)).toBeNull();
    }
  });
});

describe('requiredText', () => {
  it('trims and returns the text', () => {
    expect(requiredText('  Title  ', 10)).toBe('Title');
  });

  it('rejects blanks, non-strings and text over the limit', () => {
    expect(requiredText('   ', 10)).toBeNull();
    expect(requiredText(12, 10)).toBeNull();
    expect(requiredText('x'.repeat(11), 10)).toBeNull();
  });
});

describe('optionalText', () => {
  it('keeps undefined apart from null so a field can be left alone or cleared', () => {
    expect(optionalText(undefined, 10)).toBeUndefined();
    expect(optionalText(null, 10)).toBeNull();
  });

  it('turns blank text into null and keeps real text as written', () => {
    expect(optionalText('  ', 10)).toBeNull();
    expect(optionalText(' kept ', 10)).toBe(' kept ');
  });

  it('agrees with isValidOptionalText about the limit', () => {
    expect(isValidOptionalText('x'.repeat(10), 10)).toBe(true);
    expect(isValidOptionalText('x'.repeat(11), 10)).toBe(false);
    expect(isValidOptionalText(5, 10)).toBe(false);
    expect(isValidOptionalText(null, 10)).toBe(true);
  });
});

describe('enum guards', () => {
  it('accept the known values only', () => {
    expect(isPriority('URGENT')).toBe(true);
    expect(isPriority('urgent')).toBe(false);
    expect(isStickyNoteColor('lime')).toBe(true);
    expect(isStickyNoteColor('gold')).toBe(false);
    expect(isUserRole('ADMIN')).toBe(true);
    expect(isUserRole('ROOT')).toBe(false);
  });
});

describe('parseOptionalDate', () => {
  it('parses a date, clears on null or empty, and leaves undefined alone', () => {
    expect(parseOptionalDate('2026-09-21')).toEqual(new Date('2026-09-21'));
    expect(parseOptionalDate(null)).toBeNull();
    expect(parseOptionalDate('')).toBeNull();
    expect(parseOptionalDate(undefined)).toBeUndefined();
  });

  it('flags values that are not dates', () => {
    expect(parseOptionalDate('soon')).toBe('invalid');
    expect(parseOptionalDate(20260921)).toBe('invalid');
  });
});

describe('isEmail', () => {
  it('wants something@something.tld', () => {
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('user@example')).toBe(false);
    expect(isEmail('user example@example.com')).toBe(false);
  });
});

describe('moveItem', () => {
  it('moves an item and leaves the input untouched', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(items, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(items).toEqual(['a', 'b', 'c', 'd']);
  });

  it('clamps a target past either end', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, -5)).toEqual(['c', 'a', 'b']);
  });
});
