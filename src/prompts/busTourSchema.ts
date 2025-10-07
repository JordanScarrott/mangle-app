export const busTourSchema = `{
  "guiding_questions": [
    "Which stops are on the 107 bus route?",
    "What attractions are near the Kloof Nek bus stop?",
    "Where can I eat near the Table Mountain Cableway?",
    "Can you suggest a convenient day trip using the 107 bus?"
  ],
  "mangle_facts": [
    "bus_stop_on_route(stop_name, route_number)",
    "attraction_near_location(attraction_name, location_name)",
    "restaurant_near_location(restaurant_name, location_name)"
  ],
  "mangle_rules": [
    "attraction_is_bus_accessible(?attraction, ?bus_stop) :- attraction_near_location(?attraction, ?bus_stop), bus_stop_on_route(?bus_stop, '107')",
    "convenient_day_trip(?restaurant, ?attraction, ?bus_stop) :- restaurant_near_location(?restaurant, ?attraction), attraction_is_bus_accessible(?attraction, ?bus_stop)"
  ]
}
`;
