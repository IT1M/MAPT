import {
  sanitizeString,
  sanitizeHtml,
  sanitizeObject,
  sanitizeEmail,
  sanitizeFilename,
  sanitizeSearchQuery,
  escapeRegex,
} from '../sanitize';

describe('Sanitization utilities', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('should remove control characters', () => {
      expect(sanitizeString('hello\x00world')).toBe('helloworld');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeHtml('<p>Hello</p>')).toBe('Hello');
    });

    it('should remove script tags and content', () => {
      const result = sanitizeHtml('<script>alert("xss")</script>Hello');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should remove event handlers', () => {
      expect(sanitizeHtml('<div onclick="alert()">Hello</div>')).toBe('Hello');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeHtml('javascript:alert()')).toBe('alert()');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const obj = { name: '  John  ', age: 30 };
      expect(sanitizeObject(obj)).toEqual({ name: 'John', age: 30 });
    });

    it('should sanitize nested objects', () => {
      const obj = { user: { name: '  Jane  ' } };
      expect(sanitizeObject(obj)).toEqual({ user: { name: 'Jane' } });
    });

    it('should sanitize arrays', () => {
      const obj = { items: ['  item1  ', '  item2  '] };
      expect(sanitizeObject(obj)).toEqual({ items: ['item1', 'item2'] });
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeEmail('test<>@example.com')).toBe('test@example.com');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove directory traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove slashes', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt');
    });

    it('should replace invalid characters with underscore', () => {
      expect(sanitizeFilename('file name!@#.txt')).toBe('file_name___.txt');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove SQL wildcards', () => {
      expect(sanitizeSearchQuery('test%query')).toBe('testquery');
    });

    it('should remove SQL comments', () => {
      expect(sanitizeSearchQuery('test--query')).toBe('testquery');
    });
  });

  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegex('test.query')).toBe('test\\.query');
      expect(escapeRegex('test*query')).toBe('test\\*query');
      expect(escapeRegex('test+query')).toBe('test\\+query');
    });
  });
});
