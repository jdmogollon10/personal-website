---
# "Map of me" — the interactive first stop. Edit any text below.
map:
  hometown:
    # Caracas. To move the dot, change the coordinates (Google Maps: right-click → the numbers).
    lat: 10.4806
    lon: -66.9036
    label: Caracas
  destination:
    label: Miami
  items:
    # Upper left
    venezuela:
      label: Venezuela → Miami
      title: Where I Come From
      body: |
        Growing up in Venezuela shaped how I see opportunity, family, and hard work.
        Miami became the place where I began building the next chapter of my life.

    # Top
    creative:
      label: My Creative Side
      title: My Creative Side
      # Each item can get an optional `body:` later (a line or two about it).
      list:
        - title: YouTube creator
        - title: Fashion videographer
        - title: Runway model
        - title: App creator
          body: |
            Venezuela Earthquake 2026 humanitarian app I built to help families in Venezuela
            find missing loved ones. People can post missing-person and survivor profiles,
            share information, and report possible matches to help bring families back together.

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
