#!/bin/bash
# プロダクト記事品質評価スクリプト
# 評価基準（各1点、10点満点）:
# 1. 基本情報テーブル（| 項目 | 詳細 |）
# 2. 概要説明（〜とは？ または # プロダクト名 の後の説明段落）
# 3. 主要機能（複数のサブセクション）
# 4. 料金プラン（料金情報あり）
# 5. ソロビルダー向け活用
# 6. 注意点・制限
# 7. ユーザーの声（引用ブロック）
# 8. 関連ニュース
# 9. 公式リンク
# 10. 充実度（60行以上）

cd /Users/satokeita/Dev/ai-solo-builder

echo "slug,score,lines,basic_table,overview,features,pricing,solo_use,limitations,user_voice,news,official_link,volume"

for file in content/products/*.md; do
    slug=$(basename "$file" .md)
    content=$(cat "$file")
    lines=$(wc -l < "$file" | tr -d ' ')
    score=0
    
    # 1. 基本情報テーブル
    basic_table=0
    if echo "$content" | grep -q "| 項目 | 詳細 |"; then
        basic_table=1
        score=$((score + 1))
    fi
    
    # 2. 概要説明
    overview=0
    if echo "$content" | grep -qE "(とは？|##.*概要|^#[^#].*$)" && [ "$lines" -gt 20 ]; then
        overview=1
        score=$((score + 1))
    fi
    
    # 3. 主要機能（複数のサブセクション）
    features=0
    feature_count=$(echo "$content" | grep -cE "^###|^\*\*.*\*\*:")
    if [ "$feature_count" -ge 3 ]; then
        features=1
        score=$((score + 1))
    fi
    
    # 4. 料金プラン
    pricing=0
    if echo "$content" | grep -qiE "料金|プラン|\$[0-9]+|月額|無料|price"; then
        pricing=1
        score=$((score + 1))
    fi
    
    # 5. ソロビルダー向け活用
    solo_use=0
    if echo "$content" | grep -qiE "ソロ|使いどころ|活用|おすすめ|向け"; then
        solo_use=1
        score=$((score + 1))
    fi
    
    # 6. 注意点・制限
    limitations=0
    if echo "$content" | grep -qiE "注意点|制限|限界|限界|弱点|デメリット"; then
        limitations=1
        score=$((score + 1))
    fi
    
    # 7. ユーザーの声（引用ブロック）
    user_voice=0
    if echo "$content" | grep -qE "^> \*\*\""; then
        user_voice=1
        score=$((score + 1))
    fi
    
    # 8. 関連ニュース
    news=0
    if echo "$content" | grep -qE "関連ニュース|📰|/news/"; then
        news=1
        score=$((score + 1))
    fi
    
    # 9. 公式リンク
    official_link=0
    if echo "$content" | grep -qiE "公式.*https://|公式サイト|公式:|official"; then
        official_link=1
        score=$((score + 1))
    fi
    
    # 10. 充実度（60行以上）
    volume=0
    if [ "$lines" -ge 60 ]; then
        volume=1
        score=$((score + 1))
    fi
    
    echo "$slug,$score,$lines,$basic_table,$overview,$features,$pricing,$solo_use,$limitations,$user_voice,$news,$official_link,$volume"
done
