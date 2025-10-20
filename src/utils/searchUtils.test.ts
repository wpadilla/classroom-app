import { filterBySearch } from './searchUtils';

interface UserLike {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
}

describe('searchUtils.filterBySearch', () => {
  const students: UserLike[] = [
    { id: '1', firstName: 'José', lastName: 'Álvarez', phone: '8095550001' },
    { id: '2', firstName: 'Maria', lastName: 'Gómez', phone: '8095550002' },
    { id: '3', firstName: 'Ana', lastName: 'Nuñez', phone: '8095550003' },
  ];

  test('matches by normalized fullName (accents-insensitive)', () => {
    const res = filterBySearch(students, 'jose alvarez');
    expect(res).toHaveLength(1);
    expect(res[0].firstName).toBe('José');
  });

  test('matches by phone', () => {
    const res = filterBySearch(students, '8095550002');
    expect(res).toHaveLength(1);
    expect(res[0].lastName).toBe('Gómez');
  });

  test('matches by partial first name', () => {
    const res = filterBySearch(students, 'an');
    // Ana should match
    expect(res.find(s => s.firstName === 'Ana')).toBeTruthy();
  });

  test('empty query returns original array', () => {
    const res = filterBySearch(students, '');
    expect(res).toHaveLength(students.length);
  });

  test('accent and punctuation normalization', () => {
    const res = filterBySearch(students, 'Gomez');
    expect(res).toHaveLength(1);
    expect(res[0].lastName).toBe('Gómez');
  });
});