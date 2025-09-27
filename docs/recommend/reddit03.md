# [Tool/Resource] Built a free website to explore any city's historical weather data - perfect for climate trend analysis!

Hey r/weather community! 👋

As a weather enthusiast and developer, I've been frustrated trying to find historical weather data that's both accessible and visually appealing. Most sites either charge for data, have terrible interfaces, or limit you to recent years only.

So I built **PastWeather.org** - a completely free tool that lets you explore historical temperature data for any city worldwide, going back decades!

## What makes it useful for weather nerds like us:

**📊 Comprehensive Historical Data**
- Access temperature records from 1940 to present
- Daily high/low/average temperatures with precipitation data
- Compare the same date across multiple years (e.g., "How hot was July 4th over the past 30 years?")

**🔍 Real Analysis Tools**
- Visualize temperature trends with interactive charts
- See if your city is actually getting warmer/cooler over time
- Monthly and yearly aggregated views for pattern spotting

**🌍 Global Coverage**
- Search any city worldwide (powered by Open-Meteo's historical archives)
- Automatic geolocation or manual city search
- Support for coordinates if you want to check remote locations

**📱 Actually Usable Interface**
- Clean, responsive design that works on mobile
- No ads, no popups, no registration required
- Fast loading with intelligent caching

## Some interesting discoveries I've made:

- Phoenix, AZ has seen its average July temperatures increase by 3.2°F since 1970
- Chicago's "polar vortex" events in 2014 and 2019 really stand out when you view January historical data
- San Francisco's microclimates are wild - the temperature variations even within the city limits are fascinating

## Technical details for the curious:

- Data source: Open-Meteo Historical Weather API (they aggregate from NOAA, ERA5, and other sources)
- Built with React/TypeScript for a smooth experience
- All data is cached locally to reduce API calls and improve performance
- Completely open source if anyone wants to contribute

## Try it out:

🌐 **Website:** [https://pastweather.org](https://pastweather.org)

Some fun queries to try:
- Your birthday weather for the past 20 years
- Temperature on major historical events
- Comparing this year's extremes to historical records

I'd love to hear what interesting patterns you discover in your city! Also very open to feedback and feature requests from fellow weather enthusiasts.

**P.S.** - For those tracking climate change impacts, the long-term temperature trend visualization really puts things in perspective. I was shocked seeing my hometown's steady warming over the decades.

---

**Edit:** Wow, thanks for the amazing response! To answer some common questions:

**Q: Can I download the raw data?**
A: Working on adding CSV export functionality - should be live next week!

**Q: How accurate is the historical data?**
A: The data comes from official weather stations via Open-Meteo. Pre-1980 data might have some gaps depending on the location, but major cities have excellent coverage.

**Q: Can you add humidity/wind speed/pressure?**
A: These are on my roadmap! Currently focusing on temperature as it's the most requested, but expanding to other parameters soon.

**Q: Is there an API?**
A: Not yet, but the site is open source and you can use Open-Meteo's API directly for programmatic access.

Keep the suggestions coming! This community is exactly who I built this for. 🌡️📈