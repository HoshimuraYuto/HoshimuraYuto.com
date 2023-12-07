import sys
import json
import MeCab
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def tokenize_text(text):
    tagger = MeCab.Tagger()
    tagger.parse('')
    node = tagger.parseToNode(text)
    nouns = []
    while node:
        if node.feature.split(',')[0] == '名詞':
            nouns.append(node.surface)
        node = node.next
    return nouns

def calculate_cosine_similarity(tfidf_matrix, index):
    return cosine_similarity(tfidf_matrix[index:index+1], tfidf_matrix)

def main():
    input_str = sys.stdin.read()
    input_data = json.loads(input_str)

    documents = [doc["content"] for doc in input_data]
    tokenized_docs = [' '.join(tokenize_text(doc)) for doc in documents]

    tfidf_matrix = TfidfVectorizer().fit_transform(tokenized_docs)

    results = []
    for i, doc in enumerate(input_data):
        cosine_matrix = calculate_cosine_similarity(tfidf_matrix, i)
        top_indices = cosine_matrix.argsort()[0][::-1][1:7]
        top_docs = [input_data[j]["id"] for j in top_indices]
        results.append({"id": doc["id"], "relatedPosts": top_docs})

    print(json.dumps(results))

if __name__ == "__main__":
    main()
