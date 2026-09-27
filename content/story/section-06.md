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
  # Shown in the empty space on the right until a bubble is opened.
  intro:
    heading: Before the next door opens...
    text: Explore the places, pursuits, and ideas that brought me here.
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
      list:
        - title: YouTube creator
          body: I started filming and editing videos at 13. What began as an experiment became a lasting interest in storytelling through video.
        - title: Fashion videographer
          body: That interest took me into fashion, where I filmed and edited paid projects around runway shows and events.
        - title: Runway model
          body: "Spending time in that environment led to an unexpected opportunity: I ended up walking in three or four shows. It was a fun chance to experience the runway from the other side of the camera."

    # Upper left, below Venezuela → Miami
    entrepreneurship:
      label: Entrepreneurship
      title: Ideas I Put Into Motion
      # Each project: title, optional subtitle, optional image (shown whole, never cropped),
      # optional facts (short figures shown as a row), and body text.
      projects:
        - title: App creator
          subtitle: Venezuela Earthquake 2026
          image: /images/entrepreneurship/01.webp
          imageAlt: "Home screen of the Encuéntrame app: Venezuela Earthquake 2026, “Connecting families in moments of uncertainty,” with Search for a Person and Report a Survivor buttons"
          body: |
            I built a humanitarian app to help families in Venezuela find missing loved ones. People can post missing-person and survivor profiles, share information, and report possible matches to help bring families back together.
        - title: Pressure washing business
          facts: ["Started with $300", "Earned about $10,000"]
          body: |
            I started a door-to-door pressure washing business with $300, knocking on doors to find my own customers and doing the cleaning myself. By the time I left it, I had earned about $10,000.

    # Lower left
    interests:
      label: Interests
      title: From Options to Investing
      # Small technical details shown with the payoff sketch (decorative, not claims).
      tags: [Δ Delta, Θ Theta, ν Vega, Probability]
      visual: payoff
      body: |
        My interest in markets began in high school. Options drew me deeper: I wanted to understand the probabilities, the Greeks, and how a position changes as price, time, and volatility move.

        That curiosity eventually led me beyond individual trades and into fundamental analysis. Today, I focus on constructing a long-term portfolio grounded in business research, while studying how derivatives can hedge risk or create asymmetric exposure.
      # Later: smaller supporting items (e.g. books, podcasts) can go in a `list:` like
      # My Creative Side's; they'll appear beneath the main story.

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
