# Project Architecture & Design: Comprehensive Question List

To build the most robust, premium, and well-integrated database architecture for Tiesin, we have compiled 30 highly targeted questions. These cover Database Schema, App Logic, Shared States, UI Renames, and long-term product vision.

---

## Part 1: 20 Structured Questions (Multiple Choice / Binary / Short Answer)

### Database & Schema Scoping
1. **Kanban Board Scoping**: Is the Kanban board scoped per video project (meaning each project has its own task board), or is there one global Kanban board displaying all tasks/videos across the entire app?
   - [x] Scoped per Project (Each project contains its own set of videos and tasks)
   - [ ] Global Board (One main view listing all tasks for all videos)
   - [ ] Other: __________________

2. **Video & Project Relationship**: Can a project have multiple videos in it, or is a project strictly a 1:1 mapping to a single video?
   - [ ] 1 Project = 1 Video
   - [ ] 1 Project = Multiple Videos/Versions
   - [x] Other: Why would we even have a project AND a video, a project IS a video. Let's call it project though I like that better.__________________

3. **Storage Location for Videos**: Where do video files live?
   - [ ] Local device filesystem paths (cached or uploaded from gallery)
   - [ ] Remote URLs (hosted in Supabase Storage or external CDNs)
   - [x] Both (local cache synced to remote storage) EVERYTHING IS SYNCED TO SUPABASE ONCE ONLINE AND EVERYTHING IS ALWAYS STORED OFFLINE. THAT'S THE RULE FOR ALL THE ENTITIES AND DATA THERE IS.

4. **Logical Replication Tables in Supabase**: Which tables must have logical replication enabled for PowerSync streams?
   - [x] All tables (projects, videos, scene_dissections, style_selections, scene_mapping_outputs)
   - [ ] Only metadata tables (projects, videos, style_selections)
   - [x] Other: I don't quite understand "the term logical replication" __________________

5. **Style Selection Schema Mapping**: In your existing Supabase schema, there is a `client_sessions` table. In `supabase.ts`, it references `style_selections`. Should we rename the remote table to `style_selections` or map everything to `client_sessions`?
   - [ ] Keep `client_sessions` and map internal code to it
   - [ ] Rename the remote table to `style_selections` to match the frontend types
   - [ ] Create a separate, new table `style_selections`
   - [x] First of all how did you know about my supabase table? second of all I want to rebrand the application name and then reuse that name unto supabase. so in short let's call it "Pipeline copilot" and let's call the table "pipelines".

6. **Conflict Resolution Policy**: If a user edits a scene offline, reconnects, and someone else has updated that same scene in Supabase, what should happen?
   - [x] Last-write-wins (default PowerSync behavior; silent overwrite) precisely yes.
   - [ ] Prompt the user with a conflict resolution modal (visual diff)
   - [ ] Append/Merge changes automatically

### UI, Navigation, and Terminology
7. **File Renaming Scope**: We are renaming "Scene Mapper" to "Scene Segmentation" in the UI. Should we also physically rename the route filenames (e.g., `app/scene-segmentation/scene-mapper.tsx` ➔ `app/scene-segmentation/scene-segmentation.tsx`)?
   - [ ] Keep file/route names stable to avoid deep link breakages
   - [x] Rename both files and routes for total architectural consistency. YES OF COURSE. why would ever not do that?

8. **"Get Started" Routing Action**: When a user clicks "Get Started" on the Welcome screen, what is the ideal routing behavior?
   - [ ] Route directly to the last modified project's Kanban board
   - [ ] Route to a Project Selector/Dashboard page
   - [ ] Route to an onboarding wizard if no active projects exist
   - [x] you are talking as if this is going to be published to the world. this is my own app for my own sake and benefit. it's going to help me deliver results and it has to be perfect for my own enjoyment. when I click get started I want to see the projects page. (which is a kanban of course.)
         

9. **Kanban Status Columns**: Are the status columns of the Kanban board fixed (Todo, In Progress, Done), or do they need to be fully dynamic (modifiable by users)?
   - [ ] Fixed columns (Todo, In Progress, Done)
   - [x] Dynamic columns loaded from database, 

10. **Aesthetic Tone & Theme**: The current UI utilizes a clean, modern high-contrast layout. Should we introduce a modern Glassmorphism (blur overlays, colorful glowing backdrops) theme, or stick strictly to Neobrutalism?
    - [x] Strictly keep Neobrutalist styling, no the current style is perfected!
    - [ ] Blend in premium Glassmorphic highlights (e.g. glowing cards, blurred modals)
    - [ ] Add a selectable theme switch (Dark vs. Light vs. Glassmorphic)

### Data Lifecycle & Authentication
11. **User Authentication & Scoping**: How should sync rules define who sees which data?
    - [ ] Global sync: Everyone sees all projects and style selections (perfect for public testing)
    - [ ] User-scoped sync: Users must authenticate (Supabase Auth) and only sync their own data (`user_id = request.user_id()`)
    - [x] no need for authentification

12. **Onboarding & Seed State**: What mock or guide data should pre-load on first launch so the dashboard is immediately interactive?
    - [ ] A sample project called "Introduction Demo Video" with preset scenes and styling
    - [ ] An entirely blank slate with a beautiful "Create Your First Project" empty-state card
    - [x] I don't get what you mean. there is no need for mock I think...

13. **Local Database Filename**: What filename do you prefer for the local SQLite DB?
    - [ ] `app.db`
    - [ ] `tiesin.db`
    - [x] Other: as I said pipelines.__________________

14. **Offline Database Size Limits**: Do we need to enforce a maximum cache size for offline storage, or let it grow dynamically?
    - [ ] Set strict limit (e.g., max 100MB metadata)
    - [x] Dynamic (unlimited within device capability) no limit. my phone is tailored to function on this app. 

### Integration & Outputs
15. **Scene-Mapping Output Structure**: What is stored in the `scene_mapping_outputs` table?
    - [x] A raw JSON configuration representing the complete timeline. WE DON'T HAVE A VIDEO. what's wrong? the purpuse behid this app is allow me to map out everything pre production. so that when I sit on my setup at home I could get locked in for once and tackle all the videos at once. that's teh context. 
    - [ ] A remote URL of a rendered/compiled video output
    - [ ] Both

16. **N8N Webhook Integration**: Does the app's frontend trigger the N8N webhook directly via an HTTP request, or does the webhook monitor Supabase inserts/updates via a database trigger?
    - [ ] Frontend calls N8N webhook directly
    - [ ] N8N monitors database changes automatically
    - [x] no not yet. for now I am doing the production manually and until I am used to the workflow and fully understand all the exceptions it offers and this app is fully refined only then will n8n enter the flow.

17. **Subject Category Color Scheme**: For the subject cards in the Subject Mapper, do you want pre-allocated color schemes (e.g. Pastel primary colors), or fully random HSL color generation?
    - [ ] Curated, premium color palette, 
    - [x] Dynamic, randomized colors but in between the ranges of the app's colors.

18. **"Easily Sharable" Project Bundles**: What is the most immediate way you want users to share their video layouts?
    - [x] Local JSON file export/import (download bundle, email it, upload it)
    - [ ] Cloud sync share codes (unique UUID string to copy and load)
    - [x] I would need to publish the app for a cloud sync but I would love a good presentation of the workflow

19. **Video Playback Engine**: Will the app render previews locally using `expo-video` or standard React Native Video?
    - [ ] Local Expo Video playback
    - [ ] Simple image thumbnails (no interactive video playback required yet)
    - [x] no NO PRODUCTION EVER, THIS APP IS JUST PRE-PRODUCTION. IT'S THE PIPELINE COPILOT THAT'S IT. the pipeline will run when I share the project in json and I start my generative ai models in my setup. computer and servers. it's not an app thing.

20. **Error / Connection Alert Mode**: When PowerSync is offline, how should the UI display sync status?
    - [x] A subtle indicator in the top navbar (e.g., green dot for synced, amber for offline) just a dot on the right top corner that's it. red when offline, green when online. always utilize the premade color palette on the app.
    - [ ] Sticky full-width top alert banner

---

## Part 2: 10 Open-Ended Questions (For Deep Context)

1. **The Ultimate Vision**: What is the core problem that Tiesin solves for video creators or editors? Describe the ultimate, seamless end-user workflow.

as I said it's not video creator tailored. it's fully made for my own sake and my own problems. what the problems even are? first I spend a long time on my pc wasting time, procrastinating reading the newsletters and posts I need to visualize for my clients. let alone selecting quotes (pasting page) thinking and contemplating on the visual representation (subject page) the dissection of scenes even (scene segmentation) the coherency of the story, the shots and angles of each scene. the style ! to mimik i nthe style selector page. that's A LOOOOOOOOOOOOOOT OF THINKING AND it would take me about an hour for each think to do manually at least.
so the solution is, do this whilst in commute, internship and school... I can't find shit to do there, and I am sooo bored and would love to read and think at that time. (called escapism) so to leverage it. let's first make the manual stuff easy and fast (a great example of this is the scene segementor page, such a lovely page, the dragging and swiping of cards is such a genius way of doing everything I am so proud of what I made gorgeous stuff. and there is more pages like that to do so be patient with me today)
and second let's put it on a phone completely offline so I get to do it anywhere and sync anytime. That's the vision and cannot wait to implement and finish the app and get starting using the dreadful time I have plenty of.

2. **Collaborative Scenarios**: Can you describe a scenario where multiple video editors or client reviewers need to access and collaborate on the same scene segmentation? How does that work?

as I said it's just me, and there is a ton of pasting and copy for my multi agent workflows, and generative flows to run. and so to make it easier, I am thinking of an easy json that you copy instantly from the project's page through a button. this json will hold ALL THE KNOWLEDGE THERE IS TO STARTING GENERATING VISUALS, FRAMES, AUDIOS, AND WHATNOT. IT'S INSANE IT WILL TAKE CARE OF TIMESTAMPS, STYLES, CAMERA SHOTS, SUBJECTS, STORYBOARDING AND SO MUCH MORE. my job afterwords is refine the prompts for each frame through ai models and moving forward with a perfectly made idea waiting for execution.

3. **PowerSync Hosting Strategy**: What is your deployment strategy for PowerSync Cloud (e.g., utilizing their free tier, developer tier, or self-hosting the open-source sync engine)?

yes just a free tier. no need for fancy just reliable and cleverly made. rigid and modular that's the paradigm behind build the app that I would love you to hold dear.

4. **Subject Tagging Automation**: How smart should subject detection be in the long term? Will the application integrate with on-device machine learning (like TensorFlow Lite) or cloud AI APIs (like Gemini/Vision) to detect faces, subjects, or actions?

yes precisely, I forgot what was the name of the local model,(becuase I am almost always offline) but yes we will have a 600 to 1 gigbyte ggufed local models on my android phone. just for a quick syntax and subject detection. that's easily correctable with smart gestures and moves designed for the my controls.

4. **Timeline Synthesis Logic**: In `SYNTHESISSEQUENCER.md`, there's a roadmap for combining scenes, voice tracks, and styles. How do you see the timeline database schema expanding later to handle complex multi-track audio and transitions?

I think we just function in json. and not have the database expand at all. I am thinking it's just one pipeline table. with each row being a project. and each column being a card. that's a lovely way to put it isn't? I love smart engineering. Obviously there are many cards with many embedded in many since it's a fractal kanban structure. let's say we have kanban A and kanban B. And card A.3 refers to kanban B. should we put the A kanban card or the B kanban cards as columsn for our table? The answer is -> All the cards, of the Kanban A AND B. Let's say the smallest cards, meaning the deepest kanban cards we could get is C. as an exmaple let's say it's A, B and C. then we will have all the cards of A, B AND C. with C each holding their data. if the card opens another kanban the card will hold information on the percentage of its card compelted and whatnot. if the card type however doesn't hold any more kanban meaning it's a work card, a task card then it will hold the data of the inputs of the user (if inputted) bside the percentage as well. think with me through populating the kanban card with what data as well? MAYBE AND I JUST GOT THIS IDEA WE CAN HAVE A ONE TO MANY RELATION BETWEEN THE KANBAN CARDS AND THEIR CHILDREN CARDS AND SO ON! WHAT DO YOU THINK? that's honesly genius. spectacular in fact. I am a genius, humbly speaking. (again this is jsut thinking stage nothign serious or done for if you see a remark please highlight it. be skeptika)

5. **Platform Performance Rules**: What are the most critical mobile-specific optimizations you want us to prioritize (e.g., rapid screen loading, offline image caching, low battery consumption during gestures)?

yes yes yes, I need speed, smoothness and instant reaction time, the app has to be OPTIMIZED. IF THERE IS A SINGLE LINE THAT'S DEAD (obviously), UNOPTIMIZED, INEFICIENT OR ANYTHING ELSE PLEASE GET RID OF IT AND REFINE IT. 
I WOULD ALSO MENTION modularity. you could see that the project itself is built upon reusable building blocs. yes. beside refining those building blocs (if you see a way to do that) I would love for you to fully understand them and the existing ones, when about to create a new components name it coherently and place it where all the building blocs are for future reuses. if you notice unorgonization in the app, unmodularity, ineficiency don't waste a second without telling me!!!!

6. **Transition Feeling**: When a user performs a gesture-based split of a scene (the "zipper" gesture), describe the emotional or sensory experience the UI should evoke. Should it feel mechanical, liquid, bouncy, or lightning-fast?

instant, reactive, I want to feel I AM IN CONTROL OF IT. I want the control. the instant reaction to my finger touching the anything. that all I ever dream of.

7. **Onboarding Visual Flow**: Describe the ideal tutorial steps or onboarding screens a brand-new user should see before they arrive at the main workspace.

no tutorial. I know what I built... I have gray hair now :D

8. **Data Retention & Expiry**: How should the application clean up old data? (e.g. should projects be auto-archived after 30 days of inactivity, or stay in local SQLite forever)?

no data deletion for now. until I decide otherwise.

8. **Perfect Demo Day Success**: If this entire database and UI rename works flawlessly, what is the exact step-by-step walkthrough you would show a client to make them say "Wow"?

I started using the app.

# functionalities.
for the style selection the first stage that should be went through when starting a new project.. there will be a different way 

for the functionalities here are the cards and what I want them to do:
1. once you enter the projects kanban (clicking on the continue) there will be a button to adding another new project where it will prompt you the link to the post we are working with (note to self can you share posts? in text form from substack directly) if so that would be insane shit. it would be crazy tip.
2. entering the new project. there will be only one card in the in progress. which is one of the few columns you can click on to enter and start the task. *(beside in review where you could modify just like in progress but has  a unique button to click done where it will get the card to the done column)* A lot to unpack but this is serious important.
3. clicking on the pasting the quote or selecting the quote (I will tell you right now just a second to check for the substack features if they are available.)
4. When we have our quote. that's the catalyst to the entire project. we then will have our card in review. and another cards moves AUTOMATICALLY to in progress (it was in upnext). now you have to editable cards.  the pasting quote and this new card. this card is called style selector. which is not a kanban card it's a task card now. (take a look at structure/Visual Conditioning below).
5. This is where the style is going to be selected again must read "Visual Conditioning" in the structure heading below. the style seletion card once clicked on. doesn't show a kanban anymore. rather the questions themselves... directly. but this is where the flow will differ. This time instead of a linear fashion of answering questions one by one then matching that tally to the tally in the mega json covering all the images. This time. it's a filtering system. meaning all the questions and their answers will appear as clickable filters. which will show images at the bottom. that's it. period. the more filters at once or the more questions are answered the less images will appear. with all collages loaded at the start of the entering of the card itself. (I have made a fire thing to be honest) are we on the same page? not sure about the UI. should the fitlering be floating on top of the collage list? should the gallery be something or another. should the filtering be at the top or bottom. how ? Why? the layout division is hard for me so give me ideas.
6. Ok style is selected, gorgeous. that card is now in review.
7. scene dissection. (was in upnext and now it's in progress) this card is pretty much done it's where you devide the cards of the beats or merge them I think it's at a pretty good level. (but add an aoption at the first and last card to delete them maybe I want to cut out and lessen my work.) Obvisouly the cards are interdependent, the pasting the text card controls almost all the up next cards beside the style selector. so each dependent card has to be in progress ONLY when the mother card is in review or done.
8. one a mother card in review (A) controlling another card in progress (D), changing A will result in D to get back on in progress (if not already there) and having a pop up on it indicating it's outdated until it's back in review when done.
   GORGEOUS
9. where are we at ? when dissection is done we get the next which is subject mapping. this is where the local AI comes into place. THE HARDEST ISSUE WITH THIS CARD IS THE UX DESIGN OF IT. THERE ARE MANY FUNCTIONALITIES WITH LIMITED CONTROLS OPTIONS. still under constructions. rethink the design of it. and suggest a better more premium efficient way of doing all the functionalities. i AM SORRY my fault this is subject segmentor. this is where we identify our subjects. that's it. if they are referenced differently we clarify it the same, if they are different we clarify that as well. this serves as identification of our "things" to visualize.
10. once this is done, another card is activated (moved to in progress) which is the scene mapper. this is THAT MOST IMPORTANT CARD AND NO WONDER THE HARDEST TO VISUALLY AND USER EXPERIENCY TO DESIGN IT FEELS SO DAUNTING. 
    Let's identify what it would do.
    it will 
	1. take the segmentation of the scenes and the subjects
	2. take the style collage selected and the keywords chosen for it.
	3. AND THEN MERGE IT ALL TO CREATE A STORYBOARD. this is the storyboard catalyst of the entire app. this is nonnegotiably and undoutebly the most important section of teh entire app. wonder how can it be done...
	4. ok let's see how to merge. the first page of this card is a completely overview of all the information and data we did. an overview a layout containing the collage, the keywords, the segmenets and beats and the subjects. I want it all to be represented in a smart way allowing me to think. because it's all just me thinking. I want a good page to look at to think clearly and visualize in my head ALLLLLLLLLLL THE DIFFERNT MANY IDEAS I COULD RECORD IN IT.
	5. GOT IT. IT'S CLEAR NOW. THIS IS THE MOST IMPORTANT PAGE TO CODE IN MY LIFE. I WILL GET ON DESCRIBING IT RIGHT NOW.

# structure
Projects
---
This is where the videos will
reside. each project card will
hold information on the
prospects it's tailored to as
well as the post selected.


Stages
---
For now it's just two there is
the visual conditioning as well
as the textual. Since it's a
simple structure I am thinking
of merging them both.

Visual Conditioning
---
This is going to be a selection from precisely 690 collages existing
offline INSIDE the actual app which will increase in its size by a
waping 700 mbs.
taking a look at the style selector stage there will seem to be a ton
of question and then a tally of tags to copy by the end. that's
great. BUT REALLY SLOW.
I will providing a greater series of questions that are relevant and
useful and easy to answer as well.
I will also be providing along side the collage itself a huge json
covering all the styles with the responding json describing those
exact styles. 

so to re-explain. I will provide 690 collages with their description
meaning their tally of responses to the exact questions of the
series I will be also providing (Which is a refinement and simplification
of the current one) I hope I was clear enough.

That's it. 

How does the selection take place?

The cards themselves for each question 

Completely changend my mind, the style selector card is a task card, not a
kanban card.
Meaning that we will be deleting an entire layer of kanban since there is no
need for style selector and scene segmentor.
all the sub cards of the scene segmentor could reside alongside the style
selctor on one kanban level which is the work kanban.
Period. And that's on that. I am a genius. Thank you very much. so clicking
on a project card.
Shows you: 
1. style selector with all the questions embedded.
2. script pasting
3. subject s...
4. scene sgmentor.
5. and then the most important is the equivalent of each scene in visual
form.

so five cards that need perfecting and refining. should be easy enough. Has
to be done in one night. This night specifically.


Textual Conditioning
---
This could easily get complicated but I am going to fight myself (understatement) to grant an easy quick refining of the app.
I would declare that the north star of all the textual conditioning cards are to give a brief idea on the feel and overview on the visual
That's it. THAT'S LITERALLY IT. PERIOD AND THAT'S ON THAT.

And so all I am doing is determine the subjects and the "things" I will be showcasing.
And then what am I showcasing them with.
And then the storyline, the storyboard. AKA the relationship between the representation of those things.

Dot.

Anything else? could be techincally integrated into the app but why waste a month? when you could rely on a billions of billions of artifical neurons
to do that job for you?  AKA AI.

The Gist of it.
Now that I narrowed the scope of focus, the output quality
should reflect high level of compressed energy and attention.
in other words, this shit better be good.