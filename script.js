async function loadQuran() {
    const response = await fetch("quran_bangla_with_tafsir.json"); // নতুন ফাইল লোড হবে
    const quran = await response.json();
    return quran;
}

function extractKeywords(text) {
    let stopwords = ["কি", "কিভাবে", "কেন", "কোথায়", "হবে", "সমাধান", "উত্তর", "দরকার", "কেমন", "কোন"];
    let words = text.split(/\s+/).map(word => word.toLowerCase());
    return words.filter(word => !stopwords.includes(word));
}

function calculateRelevance(text, keywords) {
    let words = text.split(/\s+/).map(word => word.toLowerCase());
    let matchCount = keywords.filter(keyword => words.includes(keyword)).length;
    return matchCount / keywords.length;  // মিলের স্কোর নির্ধারণ
}

async function searchQuran(query) {
    const quran = await loadQuran();
    let results = [];
    let keywords = extractKeywords(query);

    for (let surah in quran) {
        for (let verse in quran[surah].verses) {
            let ayahObj = quran[surah].verses[verse]; 
            let text = ayahObj.text;  // আয়াতের মূল অংশ
            let tafsir = ayahObj.ব্যাখ্যা;  // ব্যাখ্যা যুক্ত করা হয়েছে
            
            let matchScore = calculateRelevance(text + " " + tafsir, keywords); // আয়াত ও ব্যাখ্যা একত্রে মিলানো

            if (matchScore > 0.3) {  // ৩০% বা তার বেশি মিল থাকলে
                results.push({
                    surah: quran[surah].name,
                    verse: verse,
                    text: text,
                    tafsir: tafsir,
                    score: matchScore
                });
            }
        }
    }

    results.sort((a, b) => b.score - a.score);  // সর্বোচ্চ মিল পাওয়া আয়াত প্রথমে

    if (results.length === 0) return "<p>কোনো মিল পাওয়া যায়নি!</p>";

    // সেরা আয়াত ও ব্যাখ্যা নির্বাচন
    let selectedVerses = results.slice(0, 3);
    let verseText = selectedVerses.map(r => 
        `<strong>${r.surah} - আয়াত ${r.verse}:</strong> ${r.text}<br><br>
        <em>ব্যাখ্যা:</em> ${r.tafsir}`
    ).join("<br><hr><br>");

    // উন্নত ব্যাখ্যা তৈরি করা
    let explanation = generateExplanation(query, selectedVerses);

    return `<p>${explanation}</p><br>${verseText}`;
}

function generateExplanation(query, verses) {
    let topic = extractKeywords(query).join(", ");
    let explanation = `আপনার প্রশ্ন "<strong>${query}</strong>" এর উপর ভিত্তি করে কুরআনের নিম্নলিখিত আয়াত ও ব্যাখ্যা পাওয়া গেছে। ইসলামিক দৃষ্টিকোণ থেকে এটি একটি গুরুত্বপূর্ণ বিষয়।<br><br>`;
    
    explanation += verses.map(v => `"${v.text}"`).join(" এবং ");
    explanation += "। আল্লাহ সর্বজ্ঞ ও দয়ালু, এবং এই আয়াতগুলোর মাধ্যমে তিনি আমাদের পথনির্দেশ দিয়েছেন।";

    return explanation;
}

// ইউজারের প্রশ্ন অনুসন্ধানের জন্য ইভেন্ট লিসনার
document.getElementById("searchBtn").addEventListener("click", async () => {
    let query = document.getElementById("searchBox").value.trim();
    if (query === "") {
        document.getElementById("results").innerHTML = "<p>অনুগ্রহ করে একটি প্রশ্ন লিখুন।</p>";
        return;
    }

    let finalResponse = await searchQuran(query);
    document.getElementById("results").innerHTML = finalResponse;
});