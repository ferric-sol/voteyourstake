"use client"

import React, { useState, ChangeEvent } from 'react';
import { SIMDProposal } from './types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateProposalFormProps {
  simdProposal?: SIMDProposal;
  onSubmit: (title: string, description: string, proposalId: string, endDate: Date) => void;
  onCancel: () => void;
}

const CreateProposalForm: React.FC<CreateProposalFormProps> = ({
  simdProposal,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState(simdProposal?.title || '');
  const [description, setDescription] = useState(simdProposal?.description || '');
  const [proposalId, setProposalId] = useState(simdProposal?.id || '');
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !proposalId || !endDate) {
      return;
    }
    onSubmit(title, description, proposalId, endDate);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create New Proposal</CardTitle>
          <CardDescription>
            Fill in the details to create a new on-chain proposal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proposalId">Proposal ID</Label>
            <Input
              id="proposalId"
              value={proposalId}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setProposalId(e.target.value)}
              placeholder="e.g., SIMD-123"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Enter proposal title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Enter proposal description"
              rows={5}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date: Date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Proposal</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateProposalForm; 