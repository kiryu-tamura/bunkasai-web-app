/// common.js - 全ページ共通の新着お知らせチェック機能

// Google Apps Script の Web アプリ URL (info.html と同じものを設定)
const COMMON_GAS_URL = 'https://script.google.com/macros/s/AKfycbwv5vYFdFtMztnNjfvxUpvjclMaZ1j_c2NUd_WzKunBQIXfd5dywbrFc2kgQEmd0BeLHw/exec'; // ★ご自身の実際のGAS URLに置き換えてください
const COMMON_ANNOUNCEMENTS_API_URL = COMMON_GAS_URL + '?sheet=Announcements';

// localStorage のキー (info.html と同じもの)
const COMMON_LAST_READ_ID_KEY = 'lastReadAnnouncementId_bunkasai_v2';

/**
 * フッターのお知らせアイコンに通知ドットを表示/非表示するグローバル関数
 * @param {boolean} show - trueなら表示、falseなら非表示
 */
function updateGlobalNotificationDot(show) {
    const infoNavItem = document.getElementById('info-nav-item'); // 全てのページでこのIDを持つ要素を探す
    if (infoNavItem) {
        if (show) {
            infoNavItem.classList.add('has-notification');
        } else {
            infoNavItem.classList.remove('has-notification');
        }
    }
}

/**
 * 新しいお知らせがあるか非同期でチェックし、通知ドットを更新する関数
 */
async function checkNewAnnouncements() {
    // 現在のページが info.html なら、このグローバルチェックは実行しない
    // (info.html は独自のロジックでドットを消し、既読を管理するため)
    if (window.location.pathname.endsWith('/info.html')) {
        // info.html 側でドットは消されるので、ここでは何もしないか、
        // 強制的に消したい場合は updateGlobalNotificationDot(false) を呼ぶこともできるが、
        // info.html のロジックに任せるのが一般的。
        return;
    }

    try {
        const response = await fetch(COMMON_ANNOUNCEMENTS_API_URL);
        if (!response.ok) {
            console.error('common.js: Failed to fetch announcements for notification check:', response.status);
            updateGlobalNotificationDot(false); // エラー時はドットを消しておく
            return;
        }
        const rawData = await response.json();
        if (rawData.error || !Array.isArray(rawData)) {
            console.error('common.js: Error in announcement data for notification check:', rawData.message || 'Invalid data format');
            updateGlobalNotificationDot(false);
            return;
        }

        // お知らせを逆順にする (スプレッドシートの下の行が新しいと仮定)
        const data = rawData.slice().reverse();

        let newestIdFromSheet = null;
        if (data.length > 0) {
            newestIdFromSheet = data[0].id; // 表示順で一番上 (元データの最後尾) のID
        }

        const lastReadId = localStorage.getItem(COMMON_LAST_READ_ID_KEY);

        if (newestIdFromSheet && newestIdFromSheet !== lastReadId) {
            updateGlobalNotificationDot(true); // 新着あり
        } else {
            updateGlobalNotificationDot(false); // 新着なし、またはデータなし
        }

    } catch (error) {
        console.error('common.js: Error checking new announcements:', error);
        updateGlobalNotificationDot(false); // エラー時はドットを消す
    }
}

// ページが読み込まれたときに新着をチェック
document.addEventListener('DOMContentLoaded', () => {
    checkNewAnnouncements();

    // (任意) 定期的にチェックする場合 (例: 30秒ごと)
    // 注意: 頻繁なチェックはGoogle Apps Scriptのクォータに影響する可能性があるので、
    // イベントの性質を考慮して設定してください。通常はページ読み込み時のみで十分な場合が多いです。
    // setInterval(checkNewAnnouncements, 30000);
});