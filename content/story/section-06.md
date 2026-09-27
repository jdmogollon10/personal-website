---
# "Map of me" — the interactive first stop. Edit any text below.
map:
  hometown:
    # Placeholder position (roughly the middle of Venezuela). Replace with your
    # hometown's coordinates, e.g. from Google Maps (right-click → the numbers shown).
    lat: 7.0
    lon: -66.0
    label: "[Hometown]"
  destination:
    label: Miami
  items:
    # Upper left
    venezuela:
      label: Venezuela → Miami
      title: "[Placeholder] From Venezuela to Miami"
      body: |
        [Placeholder] A few sentences about where you grew up, the move to Miami,
        and what it taught you.

    # Top
    creative:
      label: My Creative Side
      title: My Creative Side
      # Each item can get an optional `body:` later (a line or two about it).
      list:
        - title: YouTube creator
        - title: Fashion videographer
        - title: Runway model
        - title: App creator — my Venezuela app

    # Lower left — content to be decided.
    interests:
      label: Interests
      title: "[Placeholder] Interests"
      body: |
        [Placeholder] To be decided.

    # Lower right
    sports:
      label: Sports
      title: Sports
      activities: [Soccer, Tennis, Running, Working Out]
      # Carousel photos, shown in this order. To add one: put it in public/images/sports/
      # (or run: npm run photos -- "source-media/PHOTOS SPORTS" sports) and add a line.
      # To remove or reorder, delete or move lines. `alt` describes the photo for
      # screen readers.
      photos:
        - src: /images/sports/01.webp
          alt: Soccer team lined up on the field, black and white
        - src: /images/sports/02.webp
          alt: Players going for the ball in front of the goal, black and white
        - src: /images/sports/03.webp
          alt: Player controlling the ball, black and white
        - src: /images/sports/04.webp
          alt: Team photo with a trophy in front of the goal, black and white
        - src: /images/sports/05.webp
          alt: Player with the ball on the field, black and white
        - src: /images/sports/06.webp
          alt: Youth team and coaches in front of the goal, black and white
---
