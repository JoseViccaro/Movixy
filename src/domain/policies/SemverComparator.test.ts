import { describe, it, expect } from 'vitest';
import { SemverComparator } from './SemverComparator';

describe('SemverComparator', () => {
  describe('normalize', () => {
    it('strips leading v/V and trims whitespace', () => {
      expect(SemverComparator.normalize('  v1.2.3  ')).toBe('1.2.3');
      expect(SemverComparator.normalize('V2.0.0-rc.1')).toBe('2.0.0-rc.1');
      expect(SemverComparator.normalize('1.0.0')).toBe('1.0.0');
    });

    it('handles non-standard or partial versions safely', () => {
      expect(SemverComparator.normalize('')).toBe('0.0.0');
      expect(SemverComparator.normalize('1.2')).toBe('1.2.0');
      expect(SemverComparator.normalize('1')).toBe('1.0.0');
    });
  });

  describe('compare', () => {
    it('correctly compares major versions', () => {
      expect(SemverComparator.compare('2.0.0', '1.9.9')).toBe(1);
      expect(SemverComparator.compare('1.9.9', '2.0.0')).toBe(-1);
    });

    it('correctly compares minor versions', () => {
      expect(SemverComparator.compare('1.3.0', '1.2.9')).toBe(1);
      expect(SemverComparator.compare('1.2.9', '1.3.0')).toBe(-1);
    });

    it('correctly compares patch versions', () => {
      expect(SemverComparator.compare('1.2.1', '1.2.0')).toBe(1);
      expect(SemverComparator.compare('1.2.0', '1.2.1')).toBe(-1);
    });

    it('returns 0 for identical versions', () => {
      expect(SemverComparator.compare('1.0.0', 'v1.0.0')).toBe(0);
      expect(SemverComparator.compare('2.1.3', '2.1.3')).toBe(0);
    });

    it('handles pre-release tags properly (release > pre-release)', () => {
      expect(SemverComparator.compare('1.0.0', '1.0.0-rc.1')).toBe(1);
      expect(SemverComparator.compare('1.0.0-rc.1', '1.0.0')).toBe(-1);
      expect(SemverComparator.compare('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1);
      expect(SemverComparator.compare('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    });
  });

  describe('isNewer', () => {
    it('returns true when candidate is strictly newer than current', () => {
      expect(SemverComparator.isNewer('1.0.0', '1.0.1')).toBe(true);
      expect(SemverComparator.isNewer('1.0.0', '2.0.0')).toBe(true);
      expect(SemverComparator.isNewer('1.0.0-rc.1', '1.0.0')).toBe(true);
    });

    it('returns false when candidate is equal or older than current', () => {
      expect(SemverComparator.isNewer('1.0.0', '1.0.0')).toBe(false);
      expect(SemverComparator.isNewer('1.1.0', '1.0.0')).toBe(false);
      expect(SemverComparator.isNewer('2.0.0', '1.9.9')).toBe(false);
      expect(SemverComparator.isNewer('1.0.0', '1.0.0-beta.1')).toBe(false);
    });
  });
});
