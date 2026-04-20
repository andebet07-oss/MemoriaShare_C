const ROUTE_MAP: Record<string, (p: URLSearchParams) => string> = {
  Event:          (p) => `/event/${p.get('code') ?? ''}`,
  EventGallery:   (p) => `/event/${p.get('code') ?? ''}/gallery`,
  Dashboard:      (p) => `/host/events/${p.get('id') ?? ''}`,
  EventSuccess:   (p) => `/host/events/${p.get('id') ?? ''}/success`,
  MyEvents:       ()  => '/host',
  CreateEvent:    ()  => '/host/events/create',
  Home:           ()  => '/',
  MagnetLead:     ()  => '/magnet/lead',
  AdminDashboard: ()  => '/admin',
  AdminUsers:     ()  => '/admin/users',
};

export function createPageUrl(input: string): string {
  const [name, query = ''] = input.split('?');
  const mapper = ROUTE_MAP[name];
  if (mapper) return mapper(new URLSearchParams(query));
  return '/' + name.replace(/ /g, '-') + (query ? `?${query}` : '');
}
