using System.Collections.Generic;
using System.IO;
using UnityEngine;

public static class SaveSystem
{
    static readonly string SavePath = Path.Combine(Application.persistentDataPath, "save.json");

    public static void Save(SaveData data)
    {
        string json = JsonUtility.ToJson(data, prettyPrint: true);
        File.WriteAllText(SavePath, json);
    }

    public static SaveData Load()
    {
        if (!File.Exists(SavePath)) return null;
        string json = File.ReadAllText(SavePath);
        return JsonUtility.FromJson<SaveData>(json);
    }

    public static bool SaveExists() => File.Exists(SavePath);
}

[System.Serializable]
public class SaveData
{
    public Vector3 playerPosition;
    public List<PokemonSaveData> party;
    public List<string> caughtPokedex;
    public int money;
    public List<string> completedFlags;
}

[System.Serializable]
public class PokemonSaveData
{
    public string baseName;
    public int level;
    public int currentHp;
    public int exp;
    public List<string> moves;
}
