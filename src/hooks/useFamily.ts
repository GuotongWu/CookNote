import { useState, useEffect, useCallback } from 'react';
import { FamilyMember } from '../types/recipe';
import { FamilyStorage } from '../services/storage';

export const useFamily = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    try {
      const data = await FamilyStorage.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load family members:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const addMember = async (name: string, color: string) => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name,
      color,
    };
    const updated = await FamilyStorage.addMember(newMember);
    setMembers(updated);
    return newMember;
  };

  const deleteMember = async (id: string) => {
    try {
      const updated = await FamilyStorage.deleteMember(id);
      setMembers(updated);
    } catch (error) {
      console.error('Failed to delete family member:', error);
    }
  };

  return {
    members,
    isLoading,
    addMember,
    deleteMember,
    refreshMembers: loadMembers,
  };
};
