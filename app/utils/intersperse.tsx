/**
 * 配列の間に区切りとして指定された要素を挿入する
 *
 * ReactNodeの場合それぞれの値にkeyをセットするのが望ましい
 *
 * @param array - 元の配列
 * @param separator - 区切りとして挿入する要素
 * @returns - 区切りが挿入された配列
 */
const intersperse = <T,>(array: T[], separator: T): T[] => {
  return array.reduce((prev: T[], curr, idx: number) => {
    if (idx === array.length - 1) {
      return [...prev, curr];
    }
    return [...prev, curr, separator];
  }, [] as T[]);
};

export default intersperse;
