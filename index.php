<?php
// =============== PHP Logic ===============
header("Content-Type: text/html; charset=UTF-8");

// إعدادات Google API
$google_api_key = "AIzaSyC7URrX09Ao-OOuirpGt8BjNK5nfrEoOiI";
$google_cx = "ضع_هنا_رقم_cx"; // لازم تجيبه من Google Programmable Search

// مسار مجلد البيانات
$data_dir = __DIR__ . "/data";

// التأكد من وجود ملف التعلم
$learn_file = $data_dir . "/1.txt";
if (!file_exists($learn_file)) {
    file_put_contents($learn_file, "");
}

// إذا كان الطلب Ajax (إرسال سؤال)
if (isset($_POST['question'])) {
    $question = trim($_POST['question']);
    $question_lower = mb_strtolower($question, "UTF-8");
    $reply_parts = [];

    // قراءة الملفات النصية ومطابقة الكلمات
    foreach (glob($data_dir . "/*.txt") as $file) {
        $basename = basename($file, ".txt");
        if (mb_strpos($question_lower, mb_strtolower($basename, "UTF-8")) !== false) {
            $reply_parts[] = trim(file_get_contents($file));
        }
    }

    // إذا لم نجد رد في الملفات أو لو السؤال فيه كلمة "ابحث"
    if (empty($reply_parts) || mb_strpos($question_lower, "ابحث") !== false) {
        $query = str_replace("ابحث", "", $question_lower);
        $google_url = "https://www.googleapis.com/customsearch/v1?key={$google_api_key}&cx={$google_cx}&q=" . urlencode($query);
        $google_json = file_get_contents($google_url);
        $google_data = json_decode($google_json, true);

        if (isset($google_data['items'])) {
            $top_results = array_slice($google_data['items'], 0, 3);
            foreach ($top_results as $item) {
                $reply_parts[] = $item['title'] . " - " . $item['snippet'];
            }
        } else {
            $reply_parts[] = "لم أجد نتائج بحث مناسبة.";
        }
    }

    // دمج الردود في رسالة واحدة
    $final_reply = implode(" | ", $reply_parts);

    // تخزين في ملف التعلم
    file_put_contents($learn_file, "Q: $question\nA: $final_reply\n\n", FILE_APPEND);

    echo $final_reply;
    exit;
}
?>
<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title>دردشة الذكاء الاصطناعي</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #f4f4f4;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
.chat-container {
    width: 350px;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 90vh;
}
.messages {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
}
.message {
    margin: 5px 0;
    padding: 8px;
    border-radius: 6px;
    max-width: 80%;
}
.user {
    background: #0084ff;
    color: white;
    align-self: flex-end;
}
.bot {
    background: #e5e5ea;
    color: black;
    align-self: flex-start;
}
.input-container {
    display: flex;
    border-top: 1px solid #ccc;
}
input {
    flex: 1;
    padding: 10px;
    border: none;
}
button {
    padding: 10px;
    border: none;
    background: #0084ff;
    color: white;
}
</style>
</head>
<body>
<div class="chat-container">
    <div class="messages" id="messages"></div>
    <div class="input-container">
        <input type="text" id="question" placeholder="اكتب رسالتك...">
        <button onclick="sendMessage()">إرسال</button>
    </div>
</div>

<script>
function addMessage(text, sender) {
    let msgDiv = document.createElement("div");
    msgDiv.className = "message " + sender;
    msgDiv.textContent = text;
    document.getElementById("messages").appendChild(msgDiv);
    document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
}

function sendMessage() {
    let question = document.getElementById("question").value.trim();
    if (question === "") return;
    addMessage(question, "user");
    document.getElementById("question").value = "";

    fetch("", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "question=" + encodeURIComponent(question)
    })
    .then(res => res.text())
    .then(reply => {
        addMessage(reply, "bot");
    });
}
</script>
</body>
</html>