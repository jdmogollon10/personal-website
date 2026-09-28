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
          body: "Spending time in that environment led to an unexpected opportunity: I ended up walking in about three or four shows. It was a fun chance to experience the runway from the other side of the camera."

    # Upper left, below Venezuela → Miami
    entrepreneurship:
      label: Entrepreneurship
      title: Ideas I Put Into Motion
      # Each project: title, optional subtitle, optional image (shown whole, never cropped),
      # optional facts (short figures shown as a row), and body text.
      projects:
        - title: App creator
          subtitle: Venezuela Earthquake 2026
          tab: Venezuela app
          image: /images/apps/venezuela-earthquake-app-wide.webp
          imageAlt: "Encuéntrame home page: “Connecting families in moments of uncertainty,” with Search for a Person and Report a Survivor buttons, a photo of a mother hugging her daughter, and counts of missing persons, survivors registered, and people reunited"
          body: |
            I built a humanitarian app to help families in Venezuela find missing loved ones. People can post missing-person and survivor profiles, share information, and report possible matches to help bring families back together.
        - title: INTAKE
          subtitle: A finance hub that grew beyond me
          tab: INTAKE
          image: /images/apps/intake.webp
          imageAlt: "INTAKE home screen: a grid of the latest market, deal, and research headlines from many sources, with sections for Daily Brief, M&A Deals, News, Macro & Credit, and more"
          body: |
            I built INTAKE because keeping up with markets, deals, and research meant checking too many places each morning. What started as a dashboard for myself is now something I share with friends who follow the same topics.
        - title: Pressure washing business
          tab: Pressure washing
          facts: ["Started with $300", "Earned about $10,000"]
          body: |
            I started a door-to-door pressure washing business with $300, knocking on doors to find my own customers and doing the cleaning myself. By the time I left it, I had earned about $10,000.

    investing:
      label: Early Investing
      title: From Options to Investing
      # Small technical details shown with the payoff sketch (decorative, not claims).
      tags: [Δ Delta, Θ Theta, ν Vega, Probability]
      visual: payoff
      body: |
        My interest in markets began in high school. Options drew me deeper: I wanted to understand the probabilities, the Greeks, and how a position changes as price, time, and volatility move.

        That curiosity eventually led me beyond individual trades and into fundamental analysis. Today, I focus on constructing a long-term portfolio grounded in business research, while studying how derivatives can hedge risk or create asymmetric exposure.

    interests:
      label: Interests
      title: Off the Clock
      # Shown as small tiles. icon: tennis | podcast | screen | music
      list:
        - title: Learning tennis
          icon: tennis
          body: I’m learning tennis now and enjoying the process of being a beginner again.
        - title: Podcasts
          icon: podcast
          body: I’m usually listening to Acquired, Invest Like the Best, Odd Lots, or another conversation about markets and how businesses work.
        - title: On screen
          icon: screen
          body: I’m drawn to shows like Billions, Industry, and Suits.
        - title: House music & DJing
          icon: music
          body: I love house music and DJ for fun.

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
